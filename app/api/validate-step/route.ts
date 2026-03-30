import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import type { ModelConfig, WorkflowStep, UserContext, StepValidation } from "@/lib/types";

type ValidateRequest = {
  step: WorkflowStep;
  userContext: UserContext;
  previousSteps?: WorkflowStep[];
  modelConfig?: Partial<ModelConfig>;
};

export async function POST(req: Request) {
  let body: ValidateRequest | null = null;
  
  try {
    body = (await req.json()) as ValidateRequest;
    const { step, userContext, previousSteps = [], modelConfig: providedConfig } = body;

    if (!step || !userContext) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const modelConfig = await resolveModelConfig(providedConfig, "structured");

    // Build context for validation
    const contextInfo = `
Project: ${userContext.project}
Audience: ${userContext.audience}
Tech Stack: ${userContext.techStack || "Not specified"}
Depth: ${userContext.depth}
Style: ${userContext.style}
Constraints: ${userContext.constraints.join(", ")}
    `.trim();

    const previousOutputs = previousSteps
      .filter(s => s.status === "success" && s.output)
      .map(s => `Step "${s.sectionName || s.role}": ${s.output}`)
      .join("\n\n");

    const validationPrompt = `You are a workflow validation AI. Analyze if the following step task modification maintains context and coherence with the project requirements.

PROJECT CONTEXT:
${contextInfo}

${previousOutputs ? `PREVIOUS STEP OUTPUTS:\n${previousOutputs}` : "No previous steps completed yet."}

CURRENT STEP:
Role: ${step.role}
Task: ${step.task}
Step Type: ${step.stepType || "analysis"}

Analyze the step task for:
1. Context alignment - Does it match the project context and goals?
2. Coherence - Does it logically follow from previous steps?
3. Clarity - Is the task clear and executable?
4. Completeness - Does it cover necessary aspects?

Respond with JSON:
{
  "isValid": boolean,
  "confidence": number (0-1),
  "warnings": string[] (issues found),
  "suggestions": string[] (improvement suggestions),
  "contextScore": number (0-1, how well it matches context)
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [
          { role: "system", content: "You are a workflow validation expert. Always respond with valid JSON." },
          { role: "user", content: validationPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      // Fallback to basic validation if API fails
      const basicValidation = performBasicValidation(step, userContext, previousSteps);
      return NextResponse.json(basicValidation);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      const basicValidation = performBasicValidation(step, userContext, previousSteps);
      return NextResponse.json(basicValidation);
    }

    const validation: StepValidation = JSON.parse(content);
    
    return NextResponse.json({
      isValid: validation.isValid ?? true,
      confidence: validation.confidence ?? 0.8,
      warnings: validation.warnings ?? [],
      suggestions: validation.suggestions ?? [],
      contextScore: validation.contextScore ?? 0.8
    });

  } catch (error) {
    console.error("[VALIDATE_ERROR]", error);
    
    // Return basic validation on error
    if (body && 'step' in body && 'userContext' in body) {
      const basicValidation = performBasicValidation(
        body.step, 
        body.userContext, 
        (body.previousSteps || []) as WorkflowStep[]
      );
      return NextResponse.json(basicValidation);
    }
    
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function performBasicValidation(
  step: WorkflowStep, 
  userContext: UserContext, 
  previousSteps: WorkflowStep[]
): StepValidation {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let contextScore = 1.0;

  // Check if task is empty or too short
  if (!step.task || step.task.length < 10) {
    warnings.push("Task description is too short or empty");
    contextScore -= 0.2;
  }

  // Check if task mentions project context
  const projectKeywords = userContext.project.toLowerCase().split(" ");
  const taskLower = step.task.toLowerCase();
  const hasProjectContext = projectKeywords.some(keyword => 
    keyword.length > 3 && taskLower.includes(keyword)
  );
  
  if (!hasProjectContext && userContext.project) {
    warnings.push("Task doesn't reference the project context");
    suggestions.push("Consider mentioning specific project aspects");
    contextScore -= 0.1;
  }

  // Check for constraint violations
  userContext.constraints.forEach(constraint => {
    if (taskLower.includes(constraint.toLowerCase()) === false && 
        constraint.toLowerCase().includes("must")) {
      suggestions.push(`Consider addressing constraint: ${constraint}`);
    }
  });

  // Check coherence with previous steps
  if (previousSteps.length > 0) {
    const lastStep = previousSteps[previousSteps.length - 1];
    if (lastStep && lastStep.output) {
      // Basic check if current step references previous work
      const referencesPrevious = taskLower.includes("previous") || 
                                  taskLower.includes("above") ||
                                  taskLower.includes("earlier");
      
      if (!referencesPrevious && lastStep.stepType !== step.stepType) {
        suggestions.push("Consider building on previous step output");
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    confidence: Math.max(0.5, contextScore),
    warnings,
    suggestions,
    contextScore: Math.max(0.5, contextScore)
  };
}
