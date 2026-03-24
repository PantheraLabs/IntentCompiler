import { NextResponse } from "next/server";
import { MODEL_OPTIONS, getDefaultModelConfig } from "@/lib/openai";
import type { Provider } from "@/lib/types";

export async function GET() {
  const availableProviders: Provider[] = [];
  if (process.env.OPENAI_API_KEY) availableProviders.push("openai");
  if (process.env.GROQ_API_KEY) availableProviders.push("groq");

  if (!availableProviders.length) {
    return NextResponse.json(
      { error: "No model provider configured. Set OPENAI_API_KEY or GROQ_API_KEY." },
      { status: 500 }
    );
  }

  const providers = availableProviders.map((provider) => ({
    provider,
    models: MODEL_OPTIONS[provider]
  }));

  return NextResponse.json({
    providers,
    defaultConfig: getDefaultModelConfig()
  });
}
