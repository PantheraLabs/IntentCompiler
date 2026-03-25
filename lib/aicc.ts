import OpenAI from "openai";
import type { ModelConfig, Provider } from "@/lib/types";

export type AICCMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const MODEL_OPTIONS: Record<Provider, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4o-mini"],
  groq: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama-3.1-8b-instant"],
  openrouter: ["openrouter/free"],
  ollama: ["llama3", "mistral", "phi3"] // Fallback if fetch fails
};

let groqModelCache: { models: string[]; expiresAt: number } | null = null;
let ollamaModelCache: { models: string[]; expiresAt: number } | null = null;
let openRouterModelCache: { models: string[]; expiresAt: number } | null = null;

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
  if (provider === "openrouter") return Boolean(process.env.OPENROUTER_API_KEY);
  if (provider === "ollama") return true; // Local provider, assume reachable or fail gracefully
  return false;
}

export async function getAvailableProviders(): Promise<Provider[]> {
  // Cost-priority order (cheaper first): Ollama -> OpenRouter -> Groq -> OpenAI.
  const priority: Provider[] = ["ollama", "openrouter", "groq", "openai"];
  const available: Provider[] = [];
  
  for (const provider of priority) {
    if (provider === "ollama") {
      // Only include Ollama if it has models installed
      const models = await fetchOllamaModels();
      if (models.length > 0) {
        available.push(provider);
      }
    } else if (hasProviderKey(provider)) {
      available.push(provider);
    }
  }
  
  return available;
}

export async function assertAnyProviderKey() {
  const providers = await getAvailableProviders();
  if (!providers.length) {
    throw new Error(
      "No model provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or use Ollama."
    );
  }
}

async function fetchGroqModels() {
  if (!process.env.GROQ_API_KEY) {
    return MODEL_OPTIONS.groq;
  }
  if (groqModelCache && Date.now() < groqModelCache.expiresAt) {
    return groqModelCache.models;
  }
  try {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
    const response = await client.models.list();
    const models = response.data.map((m) => m.id);
    const filtered = filterTextModels(models);
    const resolved = filtered.length ? filtered : MODEL_OPTIONS.groq;
    groqModelCache = {
      models: resolved,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    return resolved;
  } catch {
    return MODEL_OPTIONS.groq;
  }
}

async function fetchOllamaModels() {
  if (ollamaModelCache && Date.now() < ollamaModelCache.expiresAt) {
    return ollamaModelCache.models;
  }
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  try {
    const response = await fetch(`${host}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000)
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { models?: Array<{ name?: string }> };
    const models = (payload.models || [])
      .map((m) => m.name?.trim())
      .filter((name): name is string => Boolean(name));
    const filtered = filterTextModels(models);
    ollamaModelCache = {
      models: filtered,
      expiresAt: Date.now() + 2 * 60 * 1000 // 2 min cache for local
    };
    return filtered;
  } catch {
    return [];
  }
}

async function fetchOpenRouterModels() {
  if (!process.env.OPENROUTER_API_KEY) {
    return MODEL_OPTIONS.openrouter;
  }
  if (openRouterModelCache && Date.now() < openRouterModelCache.expiresAt) {
    return openRouterModelCache.models;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return MODEL_OPTIONS.openrouter;
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id?: string;
        pricing?: { prompt?: string; completion?: string; request?: string };
        architecture?: { output_modalities?: string[] };
      }>;
    };

    const freeModelIds = (payload.data || [])
      .filter((model) => {
        const modalities = model.architecture?.output_modalities || [];
        if (modalities.length && !modalities.includes("text")) return false;
        const pricing = model.pricing || {};
        const prompt = Number(pricing.prompt ?? "1");
        const completion = Number(pricing.completion ?? "1");
        const request = Number(pricing.request ?? "1");
        return prompt === 0 && completion === 0 && request === 0;
      })
      .map((model) => model.id?.trim())
      .filter((id): id is string => Boolean(id));

    const deduped = Array.from(new Set(["openrouter/free", ...freeModelIds]));
    const filtered = filterTextModels(deduped);
    const resolved = filtered.length ? filtered : MODEL_OPTIONS.openrouter;
    openRouterModelCache = {
      models: resolved,
      expiresAt: Date.now() + 5 * 60 * 1000
    };
    return resolved;
  } catch {
    return MODEL_OPTIONS.openrouter;
  }
}

export async function getModelsForProvider(provider: Provider) {
  if (provider === "groq") {
    return fetchGroqModels();
  }
  if (provider === "openrouter") {
    return fetchOpenRouterModels();
  }
  if (provider === "ollama") {
    return fetchOllamaModels();
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
    const uniqueModels = models.filter((model: string) => {
      const key = model.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { provider, models: uniqueModels };
  });
}

export async function getDefaultProvider(): Promise<Provider> {
  const providers = await getAvailableProviders();
  if (!providers.length) {
    throw new Error("No model provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or use Ollama.");
  }
  return providers[0];
}

export async function selectModel(taskType: "complex" | "structured" | "simple", provider?: Provider) {
  const resolvedProvider = provider || await getDefaultProvider();
  const options = MODEL_OPTIONS[resolvedProvider];
  
  // High quality (Complex tasks: Instruction compilation)
  if (taskType === "complex") return options[0];
  
  // High efficiency (Structured tasks: Intent refinement)
  if (taskType === "structured") return options[1] || options[0];
  
  // High speed/Low cost (Simple tasks: Field suggestions)
  return options[2] || options[1] || options[0];
}

export async function resolveModelConfig(
  input: Partial<ModelConfig> | undefined,
  taskType: "complex" | "structured" | "simple" = "complex"
): Promise<ModelConfig> {
  const provider = input?.provider || await getDefaultProvider();
  const model = input?.model || await selectModel(taskType, provider);
  return { provider, model };
}

export async function callAICC(messages: AICCMessage[], config: string | Partial<ModelConfig>) {
  const resolved = typeof config === "string" ? await resolveModelConfig({ model: config }) : await resolveModelConfig(config);

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

  if (resolved.provider === "ollama") {
    const host = process.env.OLLAMA_HOST || "http://localhost:11434";
    const response = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: resolved.model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    // Normalize Ollama response to match OpenAI shape for extractAiccContent
    return {
      choices: [
        {
          message: {
            content: data.message?.content || ""
          }
        }
      ]
    };
  }

  if (resolved.provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable.");
    }
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1"
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
