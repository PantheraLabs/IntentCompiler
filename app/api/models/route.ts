import { NextResponse } from "next/server";
import { assertAnyProviderKey, getAvailableProviders, getUniqueModelsByProvider, resolveModelConfig } from "@/lib/aicc";
import { isOpenRouterModelFree } from "@/lib/modelUtils";

export async function GET() {
  try {
    await assertAnyProviderKey();
  } catch {
    return NextResponse.json(
      {
        error:
          "No model provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or use Ollama."
      },
      { status: 500 }
    );
  }

  const providers = await getAvailableProviders();
  const providersWithModels = await getUniqueModelsByProvider(providers);
  
  // Filter to only free models
  const freeProvidersWithModels = await Promise.all(
    providersWithModels.map(async ({ provider, models }) => {
      let freeModels: string[] = [];
      
      if (provider === "openrouter") {
        // Check each OpenRouter model for free pricing
        const isFreeChecks = await Promise.all(
          models.map(model => isOpenRouterModelFree(model))
        );
        freeModels = models.filter((_, index) => isFreeChecks[index]);
      } else {
        // For other providers, assume all models are available (Groq has free tier, Ollama is local)
        freeModels = models;
      }
      
      return {
        provider,
        models: freeModels
      };
    })
  );
  
  // Filter out providers with no free models
  const validProviders = freeProvidersWithModels.filter(({ models }) => models.length > 0);
  
  const fallbackConfig = await resolveModelConfig(undefined, "complex");
  const firstProvider = validProviders[0];
  const defaultConfig = firstProvider
    ? { provider: firstProvider.provider, model: firstProvider.models[0] || fallbackConfig.model }
    : fallbackConfig;

  return NextResponse.json({
    providers: validProviders,
    defaultConfig
  });
}
