import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { behaviorSchema, buildBehaviorTask, buildUserContextBlock, systemContextBlock } from "@/lib/contextCompiler";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import type { BehaviorDefinition, IntentRefinement, ModelConfig, StructuredContext, UserContext } from "@/lib/types";

type CompileBehaviorRequest = {
  intent: string;
  context: UserContext;
  target: "claude" | "agents" | "generic";
  refinement: IntentRefinement;
  structuredContext: StructuredContext;
  modelConfig?: Partial<ModelConfig>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompileBehaviorRequest;
    if (!body.refinement?.clarified_goal || !body.structuredContext?.project) {
      return NextResponse.json({ error: "Refinement and structured context are required." }, { status: 400 });
    }

    const modelConfig = resolveModelConfig(body.modelConfig, "structured");
    const userContextBlock = buildUserContextBlock(body.intent, body.context);
    const task = buildBehaviorTask(body.refinement, body.structuredContext, body.target || "generic");

    const parsed = await callJsonWithValidation<BehaviorDefinition>(
      [
        { role: "system", content: systemContextBlock() },
        { role: "user", content: userContextBlock },
        {
          role: "user",
          content: `${task}

Required JSON schema:
${JSON.stringify(behaviorSchema)}`
        }
      ],
      behaviorSchema,
      modelConfig
    );
    return NextResponse.json({ behavior: parsed, modelConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
