import { NextResponse } from "next/server";
import { behaviorSchema, buildBehaviorTask, buildContextTask, buildRefinementTask, buildUserContextBlock, contextSchema, createInstructionMarkdown, refinementSchema, systemContextBlock } from "@/lib/contextCompiler";
import { resolveModelConfig } from "@/lib/aicc";
import { evaluateInstructionMarkdown, improveInstructionMarkdown } from "@/lib/instructionQuality";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import type { BehaviorDefinition, GenerateInstructionRequest, IntentRefinement, ModelConfig, StructuredContext, UserContext } from "@/lib/types";

type CompileInstructionRequest = GenerateInstructionRequest & {
  context: UserContext;
  modelConfig?: Partial<ModelConfig>;
};

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
      {
        role: "user",
        content: `${task}

Required JSON schema:
${JSON.stringify(schema)}`
      }
    ],
    schema,
    modelConfig
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompileInstructionRequest;
    if (!body.intent?.trim()) {
      return NextResponse.json({ error: "Intent is required." }, { status: 400 });
    }

    const baseProvider = resolveModelConfig(body.modelConfig, "complex").provider;
    const refinementConfig = resolveModelConfig({ provider: baseProvider, model: body.modelConfig?.model }, "complex");
    const contextConfig = resolveModelConfig({ provider: baseProvider, model: body.modelConfig?.model }, "structured");
    const behaviorConfig = resolveModelConfig({ provider: baseProvider, model: body.modelConfig?.model }, "complex");
    const behaviorTarget = body.target === "claude" || body.target === "agents" ? body.target : "generic";
    const userContextBlock = buildUserContextBlock(body.intent, body.context);

    const refinement = await callJsonTask<IntentRefinement>({
      modelConfig: refinementConfig,
      userContextBlock,
      task: buildRefinementTask(body.intent),
      schema: refinementSchema
    });

    const structuredContext = await callJsonTask<StructuredContext>({
      modelConfig: contextConfig,
      userContextBlock,
      task: buildContextTask(refinement, body.context),
      schema: contextSchema
    });

    const behavior = await callJsonTask<BehaviorDefinition>({
      modelConfig: behaviorConfig,
      userContextBlock,
      task: buildBehaviorTask(refinement, structuredContext, behaviorTarget),
      schema: behaviorSchema
    });

    let markdown = createInstructionMarkdown(body.target, refinement, structuredContext, behavior);
    let quality = await evaluateInstructionMarkdown({
      markdown,
      target: body.target,
      projectRoot: process.cwd()
    });

    const improved = await improveInstructionMarkdown({
      markdown,
      target: body.target,
      modelConfig: refinementConfig,
      quality
    });

    if (improved !== markdown) {
      markdown = improved;
      quality = await evaluateInstructionMarkdown({
        markdown,
        target: body.target,
        projectRoot: process.cwd()
      });
    }

    return NextResponse.json({
      refinement,
      structuredContext,
      behavior,
      markdown,
      quality,
      modelConfig: refinementConfig
    });
  } catch (error) {
    console.error("[COMPILE_INSTRUCTION_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
