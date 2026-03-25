import { NextResponse } from "next/server";
import { behaviorSchema, buildBehaviorTask, buildContextTask, buildRefinementTask, buildUserContextBlock, contextSchema, createInstructionMarkdown, refinementSchema, systemContextBlock } from "@/lib/contextCompiler";
import { resolveModelConfig } from "@/lib/aicc";
import { evaluateInstructionMarkdown, improveInstructionMarkdown } from "@/lib/instructionQuality";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import type { BehaviorDefinition, GenerateInstructionRequest, IntentRefinement, ModelConfig, StructuredContext, UserContext } from "@/lib/types";

type RequestBody = GenerateInstructionRequest & { context: UserContext };
type RequestWithQualityGate = RequestBody & { enforceQualityGate?: boolean };

async function callJsonTask<T>({
  modelConfig,
  userContextBlock,
  task,
  schema
}: {
  modelConfig: ModelConfig;
  userContextBlock: string;
  task: string;
  schema: object;
}) {
  return callJsonWithValidation<T>(
    [
      { role: "system", content: systemContextBlock() },
      { role: "user", content: userContextBlock },
      { role: "user", content: `${task}\n\nRequired JSON schema:\n${JSON.stringify(schema)}` }
    ],
    schema,
    modelConfig
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestWithQualityGate;
    const { intent, context, target, modelConfig } = body;

    if (!intent || !context) {
      return NextResponse.json({ error: "Missing intent or context." }, { status: 400 });
    }

    const baseProvider = resolveModelConfig(modelConfig, "complex").provider;
    const refinementConfig = resolveModelConfig({ provider: baseProvider, model: modelConfig?.model }, "complex");
    const contextConfig = resolveModelConfig({ provider: baseProvider, model: modelConfig?.model }, "structured");
    const behaviorConfig = resolveModelConfig({ provider: baseProvider, model: modelConfig?.model }, "complex");
    const behaviorTarget = target === "claude" || target === "agents" ? target : "generic";
    const userContextBlock = buildUserContextBlock(intent, context);

    const refinement = await callJsonTask<IntentRefinement>({
      modelConfig: refinementConfig,
      userContextBlock,
      task: buildRefinementTask(intent),
      schema: refinementSchema
    });

    const structuredContext = await callJsonTask<StructuredContext>({
      modelConfig: contextConfig,
      userContextBlock,
      task: buildContextTask(refinement, context),
      schema: contextSchema
    });

    const behavior = await callJsonTask<BehaviorDefinition>({
      modelConfig: behaviorConfig,
      userContextBlock,
      task: buildBehaviorTask(refinement, structuredContext, behaviorTarget),
      schema: behaviorSchema
    });

    const originalMarkdown = createInstructionMarkdown(target, refinement, structuredContext, behavior);
    let markdown = originalMarkdown;
    let quality = await evaluateInstructionMarkdown({
      markdown,
      target,
      projectRoot: process.cwd()
    });

    const shouldImprove = body.enforceQualityGate !== false;
    const improved = shouldImprove
      ? await improveInstructionMarkdown({
          markdown,
          target,
          modelConfig: refinementConfig,
          quality
        })
      : markdown;

    if (improved !== markdown) {
      markdown = improved;
      quality = await evaluateInstructionMarkdown({
        markdown,
        target,
        projectRoot: process.cwd()
      });
    }

    return NextResponse.json({
      markdown,
      originalMarkdown,
      improvedMarkdown: improved !== originalMarkdown ? improved : "",
      refinement,
      structuredContext,
      behavior,
      quality,
      modelConfig: refinementConfig
    });
  } catch (error) {
    console.error("Instruction Generation Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
