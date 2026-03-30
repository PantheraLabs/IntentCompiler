import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import type { WorkflowStep, UserContext, ModelConfig } from "@/lib/types";
import {
  assembleInstruction,
  scoreInstruction,
  generateImprovementPrompt,
  type InstructionTarget,
  type AssembledInstruction,
  type InstructionQuality,
  QUALITY_THRESHOLD
} from "@/lib/instructionAssembler";

type AssembleRequest = {
  steps: WorkflowStep[];
  context: UserContext;
  intent: string;
  target: InstructionTarget;
  modelConfig?: Partial<ModelConfig>;
  maxIterations?: number;
};

type ImprovementIteration = {
  iteration: number;
  score: number;
  improvements: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssembleRequest;
    const { steps, context, intent, target, modelConfig: providedConfig, maxIterations = 5 } = body;

    if (!steps || !context || !intent) {
      return NextResponse.json({ error: "Invalid payload. Steps, context, and intent are required." }, { status: 400 });
    }

    const modelConfig = await resolveModelConfig(providedConfig, "structured");

    // Initial assembly from step outputs
    let currentMarkdown = assembleInstruction(steps, context, intent, target);
    let currentQuality = scoreInstruction(currentMarkdown, context);

    const iterations: ImprovementIteration[] = [{
      iteration: 0,
      score: currentQuality.overallScore,
      improvements: []
    }];

    // Iterative improvement loop
    let iteration = 0;
    while (!currentQuality.passedThreshold && iteration < maxIterations) {
      iteration++;
      
      const improvementPrompt = generateImprovementPrompt(currentQuality);
      
      // Call LLM to improve the instruction
      const improvedMarkdown = await improveInstruction(
        currentMarkdown,
        improvementPrompt,
        currentQuality,
        modelConfig
      );

      const previousScore = currentQuality.overallScore;
      currentMarkdown = improvedMarkdown;
      currentQuality = scoreInstruction(currentMarkdown, context);

      iterations.push({
        iteration,
        score: currentQuality.overallScore,
        improvements: currentQuality.suggestions.slice(0, 5)
      });

      // Safety: stop if score isn't improving
      if (currentQuality.overallScore <= previousScore && iteration >= 2) {
        break;
      }
    }

    const result: AssembledInstruction = {
      markdown: currentMarkdown,
      quality: currentQuality,
      iteration,
      maxIterations,
      improvedFrom: iterations[0]?.score
    };

    return NextResponse.json({
      ...result,
      iterations,
      threshold: QUALITY_THRESHOLD
    });

  } catch (error) {
    console.error("[ASSEMBLE_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Use LLM to improve instruction based on quality issues
 */
async function improveInstruction(
  currentMarkdown: string,
  improvementPrompt: string,
  quality: InstructionQuality,
  modelConfig: ModelConfig
): Promise<string> {
  const systemPrompt = `You are an expert AI instruction file editor. Your task is to improve the given instruction file to achieve a quality score of ${QUALITY_THRESHOLD}% or higher.

Current Quality Scores:
- Overall: ${quality.overallScore}%
- Success Rate: ${quality.successRate}%
- Clarity: ${quality.clarityRate}%
- Completeness: ${quality.completenessRate}%
- Coherence: ${quality.coherenceRate}%
- Actionability: ${quality.actionabilityRate}%

${improvementPrompt}

IMPROVEMENT GUIDELINES:
1. Add missing sections if flagged as incomplete
2. Break long paragraphs into bullet points or smaller sections
3. Add concrete examples and code blocks where appropriate
4. Ensure clear directive language (must, should, always, never)
5. Add numbered step-by-step instructions for complex tasks
6. Fill in any placeholders with specific, actionable content
7. Maintain the existing structure while enhancing content

Respond ONLY with the improved markdown content. Do not include any conversational text or explanations.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Improve this instruction file:\n\n${currentMarkdown}` }
      ],
      temperature: 0.3,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    // Return current markdown if improvement fails
    return currentMarkdown;
  }

  const data = await response.json();
  const improvedContent = data.choices?.[0]?.message?.content;

  if (!improvedContent) {
    return currentMarkdown;
  }

  return improvedContent;
}
