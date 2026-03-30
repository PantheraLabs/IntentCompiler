import { NextResponse } from "next/server";
import { getAvailableProviders, getUniqueModelsByProvider } from "@/lib/aicc";
import { callAICC, type AICCMessage } from "@/lib/aicc";

type ModelSelectionRequest = {
  intent: string;
  projectDescription?: string;
  complexity?: "simple" | "medium" | "complex";
  taskType?: "complex" | "structured" | "simple";
  maxCost?: number; // Maximum cost per request in USD
};

type FreeModel = {
  provider: string;
  model: string;
  capabilities: string[];
  costPerRequest: number;
  contextLength: number;
  speed: "fast" | "medium" | "slow";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ModelSelectionRequest;
    const { intent, projectDescription, complexity = "medium", taskType = "structured", maxCost = 0 } = body;

    if (!intent) {
      return NextResponse.json(
        { error: "Intent is required for model selection" },
        { status: 400 }
      );
    }

    // Get all available providers and their models
    const providers = await getAvailableProviders();
    const providersWithModels = await getUniqueModelsByProvider(providers);
    
    // Collect all free models from all providers
    const allFreeModels: FreeModel[] = [];
    
    for (const { provider, models } of providersWithModels) {
      for (const model of models) {
        const modelInfo = analyzeModel(model, provider);
        
        // For OpenRouter, check if model is actually free by looking at pricing
        if (provider === "openrouter") {
          const isFree = await isOpenRouterModelFree(model);
          if (isFree) {
            allFreeModels.push(modelInfo);
          }
        } else {
          // For other providers, assume all models are available (Groq has free tier, etc.)
          allFreeModels.push(modelInfo);
        }
      }
    }

    if (allFreeModels.length === 0) {
      return NextResponse.json(
        { error: "No free models available from any provider" },
        { status: 404 }
      );
    }

    // Use AI to select the best model for this specific project
    const selectedModel = await selectBestModelWithAI(
      allFreeModels,
      intent,
      projectDescription,
      complexity,
      taskType
    );

    return NextResponse.json({
      success: true,
      selectedModel,
      alternatives: allFreeModels.slice(0, 5), // Top 5 alternatives
      totalFreeModels: allFreeModels.length,
      providersConsidered: providers.length,
      reasoning: selectedModel.reasoning
    });

  } catch (error) {
    console.error("[MODEL_SELECTION_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function isOpenRouterModelFree(model: string): Promise<boolean> {
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

function analyzeModel(model: string, provider: string): FreeModel {
  const modelName = model.toLowerCase();
  
  // Determine capabilities based on model name
  const capabilities: string[] = [];
  if (modelName.includes("claude")) capabilities.push("reasoning", "analysis", "writing");
  if (modelName.includes("gpt")) capabilities.push("general", "coding", "reasoning");
  if (modelName.includes("llama")) {
    capabilities.push("general", "coding", "instruction-following");
    if (modelName.includes("3.2")) capabilities.push("multilingual", "reasoning");
  }
  if (modelName.includes("gemma")) {
    capabilities.push("multilingual", "reasoning");
    if (modelName.includes("3")) capabilities.push("multimodal", "math", "function-calling");
    if (modelName.includes("3n")) capabilities.push("efficient", "mobile", "multimodal");
  }
  if (modelName.includes("nemotron")) capabilities.push("embedding", "multimodal", "retrieval");
  if (modelName.includes("coder") || modelName.includes("code")) capabilities.push("coding");
  if (modelName.includes("instruct")) capabilities.push("instruction-following");
  if (modelName.includes("embed")) capabilities.push("embedding");
  if (modelName.includes("vl")) capabilities.push("vision-language");
  
  // Estimate cost (0 for free models)
  const costPerRequest = 0; // We're only selecting free models
  
  // Estimate context length based on model family
  let contextLength = 4096;
  
  // Specific model context lengths
  if (modelName.includes("llama-3.2") && modelName.includes("3b")) contextLength = 131000; // Llama 3.2 3B: 131K
  else if (modelName.includes("gemma-3") && modelName.includes("4b")) contextLength = 33000; // Gemma 3 4B: 33K
  else if (modelName.includes("gemma-3n") && modelName.includes("4b")) contextLength = 8000; // Gemma 3n 4B: 8K
  else if (modelName.includes("gemma-3n") && modelName.includes("2b")) contextLength = 8000; // Gemma 3n 2B: 8K
  else if (modelName.includes("gemma-3") && modelName.includes("12b")) contextLength = 33000; // Gemma 3 12B: 33K
  else if (modelName.includes("nemotron") && modelName.includes("1b")) contextLength = 131000; // Nemotron 1B: 131K
  else if (modelName.includes("70b") || modelName.includes("405b")) contextLength = 32768;
  else if (modelName.includes("34b") || modelName.includes("33b")) contextLength = 16384;
  else if (modelName.includes("8b") || modelName.includes("7b")) contextLength = 8192;
  
  // Estimate speed based on size
  let speed: "fast" | "medium" | "slow" = "medium";
  if (modelName.includes("1b") || modelName.includes("tiny")) speed = "fast";
  else if (modelName.includes("70b") || modelName.includes("405b")) speed = "slow";
  
  return {
    provider,
    model,
    capabilities,
    costPerRequest,
    contextLength,
    speed
  };
}

async function selectBestModelWithAI(
  models: FreeModel[],
  intent: string,
  projectDescription: string | undefined,
  complexity: string,
  taskType: string
): Promise<FreeModel & { reasoning: string }> {
  // Create a prompt for the AI to select the best model
  const systemPrompt: AICCMessage = {
    role: "system",
    content: `You are an expert at selecting the optimal AI model for specific projects. 
Given a project description and available models, you must choose the best free model.

Consider:
1. Model capabilities vs project requirements
2. Context length needs
3. Speed requirements
4. Task complexity
5. Model specialization

Respond with a JSON object containing:
{
  "selectedModel": "provider/model-name",
  "reasoning": "Detailed explanation of why this model was chosen",
  "confidence": 0.85
}`
  };

  const modelsList = models.map(m => 
    `- ${m.provider}/${m.model}: ${m.capabilities.join(', ')}, ${m.contextLength} context, ${m.speed} speed`
  ).join('\n');

  const userPrompt: AICCMessage = {
    role: "user", 
    content: `Project Details:
- Intent: ${intent}
- Description: ${projectDescription || 'No additional description'}
- Complexity: ${complexity}
- Task Type: ${taskType}

Available Free Models:
${modelsList}

Select the best model for this project.`
  };

  try {
    // Use a default provider for the selection (prefer Groq for speed)
    const response = await callAICC([systemPrompt, userPrompt], {
      provider: "groq",
      model: "llama-3.1-8b-instant"
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    
    // Try to extract JSON from the response
    let selection;
    try {
      selection = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        selection = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }
    
    const selectedModelName = selection.selectedModel;
    const selectedModel = models.find(m => `${m.provider}/${m.model}` === selectedModelName);
    
    if (!selectedModel) {
      throw new Error("AI selected an invalid model");
    }

    return {
      ...selectedModel,
      reasoning: selection.reasoning || "Selected based on AI analysis of project requirements"
    };

  } catch (error) {
    console.error("AI model selection failed, using fallback:", error);
    
    // Fallback: select the most capable model based on multiple factors
    const scoredModels = models.map(model => {
      let score = 0;
      
      // Score based on capabilities
      score += model.capabilities.length * 2;
      
      // Score based on context length
      score += Math.log(model.contextLength) * 0.5;
      
      // Score based on speed (fast = good)
      if (model.speed === "fast") score += 3;
      else if (model.speed === "medium") score += 1;
      
      // Bonus for coding projects
      if (intent.toLowerCase().includes("code") || intent.toLowerCase().includes("app")) {
        if (model.capabilities.includes("coding")) score += 5;
      }
      
      // Bonus for complex projects
      if (complexity === "complex") {
        if (model.capabilities.includes("reasoning") || model.capabilities.includes("analysis")) {
          score += 3;
        }
      }
      
      return { model, score };
    });
    
    const bestModel = scoredModels.reduce((best, current) => 
      current.score > best.score ? current : best
    ).model;

    return {
      ...bestModel,
      reasoning: `Selected using intelligent fallback scoring. Score: ${scoredModels.find(s => s.model === bestModel)?.score} based on capabilities (${bestModel.capabilities.length}), context length (${bestModel.contextLength}), and project requirements.`
    };
  }
}
