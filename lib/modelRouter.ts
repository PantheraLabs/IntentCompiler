import type { Provider, ModelConfig } from "@/lib/types";

export type IntentComplexity = "simple" | "moderate" | "complex" | "code" | "reasoning";

export type ModelRecommendation = {
  provider: Provider;
  model: string;
  reason: string;
  isFree: boolean;
  complexity: IntentComplexity;
  alternatives: Array<{
    provider: Provider;
    model: string;
    isFree: boolean;
    label: string;
  }>;
};

// Free model catalog - prioritized by quality within the free tier
const FREE_MODELS: Record<
  Provider,
  Array<{ model: string; strengths: string[]; contextWindow: number }>
> = {
  ollama: [
    { model: "llama3.2", strengths: ["general", "code", "chat"], contextWindow: 8192 },
    { model: "llama3", strengths: ["general", "chat"], contextWindow: 8192 },
    { model: "mistral", strengths: ["code", "reasoning", "general"], contextWindow: 32768 },
    { model: "phi3", strengths: ["simple", "fast"], contextWindow: 4096 },
    { model: "deepseek-coder", strengths: ["code"], contextWindow: 16384 }
  ],
  groq: [
    {
      model: "llama-3.3-70b-versatile",
      strengths: ["general", "reasoning", "code"],
      contextWindow: 128000
    },
    {
      model: "llama-3.1-8b-instant",
      strengths: ["simple", "fast", "chat"],
      contextWindow: 128000
    },
    { model: "mixtral-8x7b-32768", strengths: ["general", "code"], contextWindow: 32768 },
    { model: "gemma2-9b-it", strengths: ["general", "chat"], contextWindow: 8192 }
  ],
  openrouter: [
    {
      model: "deepseek/deepseek-r1:free",
      strengths: ["reasoning", "complex", "research"],
      contextWindow: 64000
    },
    {
      model: "deepseek/deepseek-chat-v3-0324:free",
      strengths: ["general", "code", "reasoning"],
      contextWindow: 64000
    },
    {
      model: "meta-llama/llama-4-maverick:free",
      strengths: ["general", "code", "moderate"],
      contextWindow: 128000
    },
    {
      model: "qwen/qwen3-coder-480b:free",
      strengths: ["code"],
      contextWindow: 32768
    },
    {
      model: "mistralai/mistral-small-3.1-24b-instruct:free",
      strengths: ["general", "moderate", "reasoning"],
      contextWindow: 128000
    },
    {
      model: "google/gemma-3-12b",
      strengths: ["general", "chat", "simple"],
      contextWindow: 128000
    }
  ],
  openai: [] // No free models
};

export function isFreeModel(model: string, provider: Provider): boolean {
  if (provider === "ollama") return true;
  if (provider === "groq") return true;
  if (model.toLowerCase().includes(":free")) return true;
  return false;
}

// Intent signal analysis — runs locally, no LLM needed
export function analyzeIntent(intent: string): IntentComplexity {
  const text = intent.toLowerCase().trim();
  const wordCount = text.split(/\s+/).length;

  const signals = {
    reasoning: [
      "analyze", "compare", "evaluate", "pros and cons", "tradeoffs",
      "architecture", "design", "why", "explain", "understand", "strategy",
      "optimize", "benchmark", "performance", "scalability", "fault-tolerant",
      "distributed", "research", "investigate", "assess"
    ],
    code: [
      "implement", "build", "code", "function", "class", "algorithm",
      "refactor", "debug", "api", "database", "sql", "typescript",
      "python", "rust", "react", "nextjs", "component", "script",
      "test", "migration", "schema", "endpoint", "backend", "frontend"
    ],
    complex: [
      "system", "pipeline", "workflow", "integration", "multi-step",
      "comprehensive", "complete", "full", "entire", "production",
      "enterprise", "roadmap", "plan", "strategy", "all", "detailed"
    ],
    simple: [
      "write", "draft", "list", "summarize", "translate", "format",
      "what is", "define", "example", "hello world", "simple", "quick",
      "short", "brief"
    ]
  };

  const score = {
    reasoning: 0,
    code: 0,
    complex: 0,
    simple: 0
  };

  for (const [category, words] of Object.entries(signals)) {
    for (const word of words) {
      if (text.includes(word)) score[category as keyof typeof score] += 1;
    }
  }

  // Long intents are inherently more complex
  if (wordCount > 30) score.complex += 2;
  if (wordCount > 60) score.complex += 3;

  // Determine complexity
  if (score.code >= 2) return "code";
  if (score.reasoning >= 2 || score.complex >= 3) return "reasoning";
  if (score.complex >= 1 || score.reasoning >= 1 || wordCount > 20) return "complex";
  if (score.simple >= 1 || wordCount <= 8) return "simple";
  return "moderate";
}

// Build a recommendation based on available providers (sorted by cost preference)
export function buildRecommendation(
  intent: string,
  availableProviders: Provider[],
  currentModels: Record<Provider, string[]>
): ModelRecommendation {
  const complexity = analyzeIntent(intent);

  // Priority map: which model strengths map to which complexity
  const strengthNeeded: Record<IntentComplexity, string[]> = {
    simple: ["simple", "fast", "chat", "general"],
    moderate: ["general", "moderate", "chat"],
    complex: ["general", "complex", "reasoning"],
    reasoning: ["reasoning", "complex", "general"],
    code: ["code", "general"]
  };

  const needed = strengthNeeded[complexity];

  // Provider priority: Ollama > Groq > OpenRouter > OpenAI
  const providerPriority: Provider[] = ["ollama", "groq", "openrouter", "openai"];
  const orderedProviders = providerPriority.filter((p) => availableProviders.includes(p));

  let best: { provider: Provider; model: string; isFree: boolean } | null = null;
  const alternatives: ModelRecommendation["alternatives"] = [];

  for (const provider of orderedProviders) {
    const catalog = FREE_MODELS[provider];
    const available = currentModels[provider] ?? [];

    // Filter catalog by what's actually available for this provider
    const candidates = catalog.filter(
      (entry) =>
        available.some(
          (m) => m.toLowerCase().includes(entry.model.split("/").pop()?.split(":")[0] ?? "")
        ) || provider === "groq" // Groq models are always available if key exists
    );

    // Find best match for this complexity
    const match = candidates.find((c) =>
      needed.some((strength) => c.strengths.includes(strength))
    );

    const chosen = match ?? candidates[0];
    if (!chosen) continue;

    const modelId = chosen.model;
    const isFree = isFreeModel(modelId, provider);

    if (!best) {
      best = { provider, model: modelId, isFree };
    } else {
      alternatives.push({
        provider,
        model: modelId,
        isFree,
        label: `${provider === "openrouter" ? "OpenRouter" : provider.charAt(0).toUpperCase() + provider.slice(1)} — ${chosen.model.split("/").pop()?.split(":")[0]}`
      });
    }

    if (alternatives.length >= 2) break;
  }

  // Fallback if nothing matched
  if (!best) {
    best = { provider: "groq", model: "llama-3.1-8b-instant", isFree: true };
  }

  const reasonMap: Record<IntentComplexity, string> = {
    simple: "Simple task detected — using a fast, lightweight free model.",
    moderate: "Moderate complexity — using a capable free general-purpose model.",
    complex: "Complex multi-step task — using a high-capacity free model.",
    reasoning: "Deep reasoning required — routing to a top-tier reasoning model at zero cost.",
    code: "Code-generation task — routing to a code-specialized free model."
  };

  return {
    provider: best.provider,
    model: best.model,
    reason: reasonMap[complexity],
    isFree: best.isFree,
    complexity,
    alternatives
  };
}

export function applyRecommendation(rec: ModelRecommendation): ModelConfig {
  return { provider: rec.provider, model: rec.model };
}
