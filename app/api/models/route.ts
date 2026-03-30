import { NextResponse } from "next/server";
import { assertAnyProviderKey, getAvailableProviders, getUniqueModelsByProvider, resolveModelConfig } from "@/lib/aicc";

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

  const providers = (await getUniqueModelsByProvider(await getAvailableProviders())).filter((entry) => entry.models.length > 0);
  const fallbackConfig = await resolveModelConfig(undefined, "complex");
  const firstProvider = providers[0];
  const defaultConfig = firstProvider
    ? { provider: firstProvider.provider, model: firstProvider.models[0] || fallbackConfig.model }
    : fallbackConfig;

  return NextResponse.json({
    providers,
    defaultConfig
  });
}
