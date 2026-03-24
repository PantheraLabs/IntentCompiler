import OpenAI from "openai";
import type { ModelConfig, Provider } from "@/lib/types";

const OPENAI_DEFAULT_MODEL = "gpt-4.1";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";
const AICC_DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

export const MODEL_OPTIONS: Record<Provider, string[]> = {
  openai: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  aicc: ["anthropic/claude-3.5-sonnet", "mistral/mixtral-8x7b", "meta-llama/llama-3-8b"]
};

export function getDefaultModelConfig(): ModelConfig {
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", model: OPENAI_DEFAULT_MODEL };
  }
  if (process.env.GROQ_API_KEY) {
    return { provider: "groq", model: GROQ_DEFAULT_MODEL };
  }
  return { provider: "aicc", model: AICC_DEFAULT_MODEL };
}

export function resolveModelConfig(input?: Partial<ModelConfig>): ModelConfig {
  const fallback = getDefaultModelConfig();
  const provider = input?.provider ?? fallback.provider;
  const model = input?.model ?? fallback.model;
  return { provider, model };
}

export function getLLMClient(config?: Partial<ModelConfig>) {
  const resolved = resolveModelConfig(config);

  if (resolved.provider === "groq") {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY environment variable.");
    }
    return {
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
      }),
      model: resolved.model,
      provider: resolved.provider
    };
  }

  if (resolved.provider === "aicc") {
    throw new Error("AICC provider is handled via /lib/aicc.ts client helpers.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: resolved.model,
    provider: resolved.provider
  };
}
