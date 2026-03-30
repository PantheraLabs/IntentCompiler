import { getAvailableProviders } from "./aicc";

export async function isOpenRouterModelFree(model: string): Promise<boolean> {
  try {
    const response = await fetch(`https://openrouter.ai/api/v1/models`, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const modelData = data.data?.find((m: any) => m.id === model);
    
    if (!modelData?.pricing) return false;
    
    const { prompt = "0", completion = "0", request = "0" } = modelData.pricing;
    
    // Model is free if all pricing components are 0
    return prompt === "0" && completion === "0" && request === "0";
    
  } catch {
    // If we can't check pricing, assume not free to be safe
    return false;
  }
}
