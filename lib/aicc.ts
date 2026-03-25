import OpenAI from "openai";
import type { ModelConfig, Provider } from "@/lib/types";

export type AICCMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const MODEL_OPTIONS: Record<Provider, string[]> = {
  openai: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  aicc: ["anthropic/claude-3.5-sonnet", "mistral/mixtral-8x7b", "meta-llama/llama-3-8b"]
};

let aiccModelCache: { models: string[]; expiresAt: number } | null = null;

function isTextFirstModel(model: string) {
  const id = model.toLowerCase();
  const blockedKeywords = [
    "image",
    "vision",
    "sora",
    "veo",
    "kling",
    "flux",
    "sdxl",
    "stable-diffusion",
    "dall",
    "whisper",
    "tts",
    "audio"
  ];
  return !blockedKeywords.some((keyword) => id.includes(keyword));
}

function filterTextModels(models: string[]) {
  return models.filter(isTextFirstModel);
}

function hasProviderKey(provider: Provider) {
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY);
  return Boolean(process.env.AICC_API_KEY);
}

export function getAvailableProviders(): Provider[] {
  // Cost-priority order (cheaper first): AICC -> Groq -> OpenAI.
  const priority: Provider[] = ["aicc", "groq", "openai"];
  return priority.filter((provider) => hasProviderKey(provider));
}

export function assertAnyProviderKey() {
  if (!getAvailableProviders().length) {
    throw new Error("No model provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or AICC_API_KEY.");
  }
}

async function fetchAiccModels() {
  if (!process.env.AICC_API_KEY) {
    return MODEL_OPTIONS.aicc;
  }

  if (aiccModelCache && Date.now() < aiccModelCache.expiresAt) {
    return aiccModelCache.models;
  }

  try {
    const response = await fetch("https://api.ai.cc/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.AICC_API_KEY}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return MODEL_OPTIONS.aicc;
    }

    const payload = (await response.json()) as { data?: Array<{ id?: string }> };
    const models = Array.from(
      new Set(
        (payload.data || [])
          .map((entry) => entry.id?.trim())
          .filter((id): id is string => Boolean(id))
      )
    );

    const filtered = filterTextModels(models);
    const resolved = filtered.length ? filtered : MODEL_OPTIONS.aicc;
    aiccModelCache = {
      models: resolved,
      expiresAt: Date.now() + 5 * 60 * 1000
    };
    return resolved;
  } catch {
    return MODEL_OPTIONS.aicc;
  }
}

export async function getModelsForProvider(provider: Provider) {
  if (provider === "aicc") {
    return fetchAiccModels();
  }
  return filterTextModels(MODEL_OPTIONS[provider]);
}

export async function getUniqueModelsByProvider(providers: Provider[]) {
  const seen = new Set<string>();
  const entries = await Promise.all(
    providers.map(async (provider) => ({
      provider,
      models: await getModelsForProvider(provider)
    }))
  );
  return entries.map(({ provider, models }) => {
    const uniqueModels = models.filter((model) => {
      const key = model.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { provider, models: uniqueModels };
  });
}

export function getDefaultProvider(): Provider {
  const providers = getAvailableProviders();
  if (!providers.length) {
    throw new Error("No model provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or AICC_API_KEY.");
  }
  return providers[0];
}

export function selectModel(taskType: "complex" | "structured" | "simple", provider: Provider = getDefaultProvider()) {
  const options = MODEL_OPTIONS[provider];
  if (taskType === "complex") return options[0];
  if (taskType === "structured") return options[1] || options[0];
  return options[2] || options[0];
}

export function resolveModelConfig(
  input: Partial<ModelConfig> | undefined,
  taskType: "complex" | "structured" | "simple" = "complex"
): ModelConfig {
  const provider = input?.provider || getDefaultProvider();
  const model = input?.model || selectModel(taskType, provider);
  return { provider, model };
}

export async function callAICC(messages: AICCMessage[], config: string | Partial<ModelConfig>) {
  const resolved = typeof config === "string" ? resolveModelConfig({ model: config }) : resolveModelConfig(config);

  if (resolved.provider === "aicc") {
    if (!process.env.AICC_API_KEY) {
      throw new Error("Missing AICC_API_KEY environment variable.");
    }

    const response = await fetch("https://api.ai.cc/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AICC_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: resolved.model,
        messages
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AICC request failed (${response.status}): ${errorBody}`);
    }

    return response.json();
  }

  if (resolved.provider === "groq") {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY environment variable.");
    }
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
    return client.chat.completions.create({
      model: resolved.model,
      messages
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client.chat.completions.create({
    model: resolved.model,
    messages
  });
}

export function extractAiccContent(payload: unknown) {
  const parsed = payload as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  };
  let content = parsed.choices?.[0]?.message?.content || "";

  if (Array.isArray(content)) {
    content = content
      .map((part) => (part.type === "text" && part.text ? part.text : ""))
      .join("")
      .trim();
  }

  if (typeof content !== "string") {
    return "{}";
  }

  // Robustly extract JSON from potential markdown wrappers
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim();
  }

  return content.trim() || "{}";
}
