import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { buildRefinementTask, buildUserContextBlock, refinementSchema, systemContextBlock } from "@/lib/contextCompiler";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import type { IntentRefinement, ModelConfig, UserContext } from "@/lib/types";

type RefineIntentRequest = {
  intent: string;
  context: UserContext;
  modelConfig?: Partial<ModelConfig>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RefineIntentRequest;
    if (!body.intent?.trim()) {
      return NextResponse.json({ error: "Intent is required." }, { status: 400 });
    }

    const modelConfig = await resolveModelConfig(body.modelConfig, "complex");
    const userContextBlock = buildUserContextBlock(body.intent, body.context);
    const task = buildRefinementTask(body.intent);

    const parsed = await callJsonWithValidation<IntentRefinement>(
      [
        { role: "system", content: systemContextBlock() },
        { role: "user", content: userContextBlock },
        {
          role: "user",
          content: `${task}

Required JSON schema:
${JSON.stringify(refinementSchema)}`
        }
      ],
      refinementSchema,
      modelConfig
    );
    return NextResponse.json({ refinement: parsed, modelConfig });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
