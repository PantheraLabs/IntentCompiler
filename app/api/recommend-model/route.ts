import { NextResponse } from "next/server";
import { assertAnyProviderKey, callAICC, getModelsForProvider, getAvailableProviders } from "@/lib/aicc";
import { analyzeIntent, buildRecommendation } from "@/lib/modelRouter";
import type { Provider } from "@/lib/types";

export const runtime = "nodejs";

// The catalog we expose to the LLM so it can reason about model choices
const MODEL_CATALOG = [
  // Ollama (local, fully free)
  { provider: "ollama", model: "llama3.2", free: true, strengths: "Fast, general purpose, private local inference" },
  { provider: "ollama", model: "mistral", free: true, strengths: "Strong reasoning, code, local private" },
  { provider: "ollama", model: "deepseek-coder", free: true, strengths: "Code generation, local" },
  // Groq (free with rate limits, very fast)
  { provider: "groq", model: "llama-3.3-70b-versatile", free: true, strengths: "High quality, general purpose, fast inference, 128k context" },
  { provider: "groq", model: "llama-3.1-8b-instant", free: true, strengths: "Ultra fast, simple tasks, low latency" },
  { provider: "groq", model: "mixtral-8x7b-32768", free: true, strengths: "Instruction following, code, general, 32k context" },
  { provider: "groq", model: "gemma2-9b-it", free: true, strengths: "Efficient, general chat, Google architecture" },
  // OpenRouter free models
  { provider: "openrouter", model: "deepseek/deepseek-r1:free", free: true, strengths: "Deep chain-of-thought reasoning, research, complex analysis" },
  { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free", free: true, strengths: "Strong coding, general, reasoning, 64k context" },
  { provider: "openrouter", model: "meta-llama/llama-4-maverick:free", free: true, strengths: "Top-tier general purpose, code, 128k context" },
  { provider: "openrouter", model: "qwen/qwen3-coder-480b:free", free: true, strengths: "Best-in-class code generation, massive MoE model" },
  { provider: "openrouter", model: "mistralai/mistral-small-3.1-24b-instruct:free", free: true, strengths: "Efficient instruction following, general, 128k context" },
  { provider: "openrouter", model: "google/gemma-3-12b", free: true, strengths: "Google architecture, fast, general, 128k context" },
  // OpenAI (paid, fallback only)
  { provider: "openai", model: "gpt-4o-mini", free: false, strengths: "Highly capable, cost effective paid option" },
  { provider: "openai", model: "gpt-4o", free: false, strengths: "Best overall capability, complex reasoning (paid)" },
];

type RecommendRequest = {
  intent: string;
  availableProviders?: Provider[];
};

export async function POST(req: Request) {
  try {
    await assertAnyProviderKey();
    const body = (await req.json()) as RecommendRequest;
    const { intent } = body;

    if (!intent?.trim()) {
      return NextResponse.json({ error: "No intent provided." }, { status: 400 });
    }

    // Determine which providers are actually configured
    const availableProviders = await getAvailableProviders();

    // Get actual available models per provider for context
    const modelsByProvider: Record<string, string[]> = {};
    await Promise.all(
      availableProviders.map(async (p) => {
        try {
          modelsByProvider[p] = await getModelsForProvider(p);
        } catch {
          modelsByProvider[p] = [];
        }
      })
    );

    // Filter catalog to only include available providers
    const availableCatalog = MODEL_CATALOG.filter((m) =>
      availableProviders.includes(m.provider as Provider)
    );

    const catalogText = availableCatalog
      .map((m) => `- provider="${m.provider}" model="${m.model}" free=${m.free} | ${m.strengths}`)
      .join("\n");

    const systemPrompt = `You are an expert AI model router. Your job is to analyze a user's intent and select the single best model from the available catalog to handle that task.

RULES:
1. Always prefer free models. Only recommend paid models if no free option can handle the task.
2. Match the model to the task complexity: simple tasks → fast models, reasoning tasks → reasoning models, code tasks → code models.
3. Provider priority (cost): ollama (local, free) > groq (fast, free) > openrouter (free) > openai (paid).
4. Return ONLY a valid JSON object. No markdown, no explanation outside JSON.

AVAILABLE MODEL CATALOG:
${catalogText}

RESPONSE FORMAT:
{
  "provider": "<provider>",
  "model": "<model>",
  "reason": "<1-2 sentence explanation of why this model fits>",
  "isFree": <true|false>,
  "complexity": "<simple|moderate|complex|code|reasoning>",
  "alternatives": [
    { "provider": "<p>", "model": "<m>", "isFree": <true|false>, "label": "<short label>" }
  ]
}
Return exactly 2 alternatives (different providers or models). Alternatives must also be free if possible.`;

    const userMessage = `User intent: "${intent}"

Select the best model from the catalog for this intent. Consider complexity, domain, and cost.`;

    // Use a fast, free model (Groq 8b) to make the routing decision
    if (availableProviders.length === 0) {
       return NextResponse.json({ error: "No providers configured." }, { status: 400 });
    }

    const routingModel = availableProviders.includes("groq")
      ? { provider: "groq" as Provider, model: "llama-3.1-8b-instant" }
      : availableProviders.includes("openrouter") 
        ? { provider: "openrouter" as Provider, model: "google/gemma-3-12b" }
        : { provider: availableProviders[0], model: modelsByProvider[availableProviders[0]]?.[0] ?? "" };

    if (!routingModel.model) {
      // Fallback to internal recommendation if no valid LLM model is found to even make the routing decision
      const fallback = buildRecommendation(intent, availableProviders, modelsByProvider as any);
      return NextResponse.json(fallback);
    }

    const raw = await callAICC(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      routingModel
    );

    // Parse JSON from response
    const content = typeof raw === 'object' && raw !== null && 'choices' in raw 
      ? raw.choices[0]?.message?.content || ""
      : String(raw);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON in model response");
    }
    const recommendation = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recommendation);
  } catch (err) {
    // Fallback: use local heuristics from modelRouter.ts
    console.error("LLM routing failed, falling back to heuristics:", err);
    try {
      const resp = await req.clone().json();
      const intent = resp.intent;
      const availableProviders = await getAvailableProviders();
      const modelsByProvider: Record<string, string[]> = {};
      await Promise.all(
        availableProviders.map(async (p: Provider) => {
          modelsByProvider[p] = await getModelsForProvider(p);
        })
      );
      const fallback = buildRecommendation(intent, availableProviders, modelsByProvider as any);
      return NextResponse.json(fallback);
    } catch (innerErr) {
      console.error("Fallback also failed:", innerErr);
      return NextResponse.json({ error: "Model recommendation failed." }, { status: 500 });
    }
  }
}
