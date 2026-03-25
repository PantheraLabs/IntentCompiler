import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { buildSuggestionTask, suggestionSchema, systemContextBlock } from "@/lib/contextCompiler";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import type { ModelConfig } from "@/lib/types";

type SuggestRequest = {
  intent: string;
  modelConfig?: Partial<ModelConfig>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SuggestRequest;
    if (!body.intent?.trim()) {
      return NextResponse.json({ error: "Intent is required." }, { status: 400 });
    }

    const modelConfig = resolveModelConfig(body.modelConfig, "simple");
    const task = buildSuggestionTask(body.intent);

    const parsed = await callJsonWithValidation(
      [
        { role: "system", content: systemContextBlock() },
        {
          role: "user",
          content: `${task}

Required JSON format:
${JSON.stringify(suggestionSchema)}`
        }
      ],
      suggestionSchema,
      modelConfig
    );
    return NextResponse.json({ suggestions: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
