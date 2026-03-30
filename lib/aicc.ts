import OpenAI from "openai";
import type { ModelConfig, Provider } from "@/lib/types";

export type AICCMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Model selection preferences by task type
const MODEL_PREFERENCES = {
  complex: ["claude", "gpt-4", "llama-3.3", "mixtral", "gemini-pro"], // High quality
  structured: ["gpt-4o", "llama-3.1", "gemini-flash", "qwen"], // High efficiency  
  simple: ["llama-3.1-8b", "gpt-3.5", "gemini-1.5", "phi"] // High speed/low cost
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
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY);
  if (provider === "openrouter") return Boolean(process.env.OPENROUTER_API_KEY);
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "ollama") return true; // Local provider, assume reachable or fail gracefully
  
  // For any other provider, check for environment variable in format: PROVIDER_NAME_API_KEY
  const envVarName = `${provider.toUpperCase()}_API_KEY`;
  return Boolean(process.env[envVarName]);
}

export async function getAvailableProviders(): Promise<Provider[]> {
  // Known providers with specific logic
  const knownProviders: Provider[] = ["ollama", "openrouter", "groq", "openai"];
  const available: Provider[] = [];
  
  // Check known providers first
  for (const provider of knownProviders) {
    if (provider === "ollama") {
      // Only include Ollama if it has models installed
      const models = await fetchOllamaModels();
      if (models.length > 0) {
        available.push(provider);
      }
    } else if (provider === "openrouter") {
      // Only include OpenRouter if it has API key AND models
      if (hasProviderKey(provider)) {
        const models = await fetchOpenRouterModels();
        if (models.length > 0) {
          available.push(provider);
        }
      }
    } else if (hasProviderKey(provider)) {
      available.push(provider);
    }
  }
  
  // Check for any additional providers via environment variables
  // Format: PROVIDER_NAME_API_KEY and optionally PROVIDER_NAME_BASE_URL
  const envProviders = Object.keys(process.env)
    .filter(key => key.endsWith('_API_KEY') && !knownProviders.some(p => key === `${p.toUpperCase()}_API_KEY`))
    .map(key => key.replace('_API_KEY', '').toLowerCase() as Provider)
    .filter(provider => hasProviderKey(provider));
  
  available.push(...envProviders);
  
  return available;
}

export async function assertAnyProviderKey() {
  const providers = await getAvailableProviders();
  if (!providers.length) {
    throw new Error(
      "No model provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or use Ollama."
    );
  }
}

async function fetchGroqModels() {
  if (!process.env.GROQ_API_KEY) {
    return [];
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
    groqModelCache = {
      models: filtered,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    return filtered;
  } catch {
    return [];
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
    return [];
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
      return [];
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id?: string;
        pricing?: { prompt?: string; completion?: string; request?: string };
        architecture?: { output_modalities?: string[] };
      }>;
    };

    const models = (payload.data || [])
      .filter((model) => model.id)
      .map((model) => model.id!)
      .filter(isTextFirstModel);

    // Show all models, not just free ones (let the model selection API handle filtering)
    const filtered = filterTextModels(models);
    openRouterModelCache = {
      models: filtered,
      expiresAt: Date.now() + 5 * 60 * 1000
    };
    return filtered;
  } catch {
    return [];
  }
}

async function fetchOpenAIModels() {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    const response = await client.models.list();
    const models = response.data.map((m) => m.id);
    return filterTextModels(models);
  } catch {
    return [];
  }
}

async function fetchGenericModels(provider: Provider) {
  // Try to fetch models from a generic OpenAI-compatible endpoint
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  const baseUrl = process.env[`${provider.toUpperCase()}_BASE_URL`] || `https://api.${provider}.com/v1`;
  
  if (!apiKey) return [];
  
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl
    });
    const response = await client.models.list();
    const models = response.data.map((m) => m.id);
    return filterTextModels(models);
  } catch {
    return [];
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
  if (provider === "openai") {
    return fetchOpenAIModels();
  }
  
  // Generic fetch for any other provider
  return fetchGenericModels(provider);
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
    throw new Error("No model provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or use Ollama.");
  }
  return providers[0];
}

export async function selectModel(taskType: "complex" | "structured" | "simple", provider?: Provider) {
  const resolvedProvider = provider || await getDefaultProvider();
  const availableModels = await getModelsForProvider(resolvedProvider);
  
  if (availableModels.length === 0) {
    throw new Error(`No models available for provider: ${resolvedProvider}`);
  }
  
  // Get preferences for this task type
  const preferences = MODEL_PREFERENCES[taskType];
  
  // Score models based on preference matches and other factors
  const scoredModels = availableModels.map((model: string) => {
    const modelName = model.toLowerCase();
    
    // Calculate preference score
    let score = 0;
    for (const pref of preferences) {
      if (modelName.includes(pref)) {
        score += 10; // Strong preference match
      }
    }
    
    // Bonus for well-known model families
    if (modelName.includes("claude")) score += 5;
    if (modelName.includes("gpt-4")) score += 5;
    if (modelName.includes("llama-3")) score += 3;
    if (modelName.includes("gemini")) score += 3;
    
    // Penalty for very small models for complex tasks
    if (taskType === "complex" && (modelName.includes("1b") || modelName.includes("tiny"))) {
      score -= 5;
    }
    
    // Penalty for very large models for simple tasks  
    if (taskType === "simple" && (modelName.includes("70b") || modelName.includes("405b"))) {
      score -= 3;
    }
    
    return { model, score };
  });
  
  // Sort by score (highest first) and return the best model
  scoredModels.sort((a: { model: string; score: number }, b: { model: string; score: number }) => b.score - a.score);
  
  const selected = scoredModels[0]?.model || availableModels[0];
  
  return selected;
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

  throw new Error(`Unsupported provider: ${resolved.provider}`);
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
