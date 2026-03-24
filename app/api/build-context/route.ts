import { NextResponse } from "next/server";
import { callAICC, extractAiccContent, resolveModelConfig } from "@/lib/aicc";
import { buildContextTask, buildUserContextBlock, contextSchema, systemContextBlock } from "@/lib/contextCompiler";
import type { IntentRefinement, ModelConfig, StructuredContext, UserContext } from "@/lib/types";

type BuildContextRequest = {
  intent: string;
  refinement: IntentRefinement;
  context: UserContext;
  modelConfig?: Partial<ModelConfig>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BuildContextRequest;
    if (!body.refinement?.clarified_goal) {
      return NextResponse.json({ error: "Refinement input is required." }, { status: 400 });
    }

    const modelConfig = resolveModelConfig(body.modelConfig, "structured");
    const userContextBlock = buildUserContextBlock(body.intent, body.context);
    const task = buildContextTask(body.refinement, body.context);

    const response = await callAICC(
      [
        { role: "system", content: systemContextBlock() },
        { role: "user", content: userContextBlock },
        {
          role: "user",
          content: `${task}

Required JSON schema:
${JSON.stringify(contextSchema)}`
        }
      ],
      modelConfig
    );

    const parsed = JSON.parse(extractAiccContent(response)) as StructuredContext;
    return NextResponse.json({ structuredContext: parsed, modelConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
