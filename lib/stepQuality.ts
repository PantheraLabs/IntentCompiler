import { callAICC, extractAiccContent } from "@/lib/aicc";
import type { ModelConfig, WorkflowStep } from "@/lib/types";

export type StepQualityDimension = 
  | "clarity" 
  | "completeness" 
  | "formatCompliance" 
  | "dependencyUse" 
  | "safety";

export type StepQualityIssue = {
  severity: "high" | "medium" | "low";
  category: StepQualityDimension;
  message: string;
};

export type StepQualityReport = {
  score: number; // 0-100
  dimensions: Record<StepQualityDimension, number>; // 0-5 scale
  issues: StepQualityIssue[];
  suggestions: string[];
};

/**
 * Evaluate step output quality using rule-based checks + LLM evaluation
 */
export async function evaluateStepQuality(
  step: WorkflowStep,
  output: string,
  previousOutputs: string[],
  modelConfig: ModelConfig
): Promise<StepQualityReport> {
  const issues: StepQualityIssue[] = [];
  const dimensions: Record<StepQualityDimension, number> = {
    clarity: 5,
    completeness: 5,
    formatCompliance: 5,
    dependencyUse: 5,
    safety: 5
  };

  // Rule-based checks
  
  // 1. Check must_include requirements
  if (step.mustInclude?.length) {
    const normalized = output.toLowerCase();
    const missing = step.mustInclude.filter(item => !normalized.includes(item.toLowerCase()));
    if (missing.length > 0) {
      issues.push({
        severity: "high",
        category: "completeness",
        message: `Missing required content: ${missing.join(", ")}`
      });
      dimensions.completeness -= missing.length * 1.5;
    }
  }

  // 2. Check must_avoid restrictions
  if (step.mustAvoid?.length) {
    const normalized = output.toLowerCase();
    const present = step.mustAvoid.filter(item => normalized.includes(item.toLowerCase()));
    if (present.length > 0) {
      issues.push({
        severity: "high",
        category: "safety",
        message: `Contains forbidden content: ${present.join(", ")}`
      });
      dimensions.safety -= present.length * 2;
    }
  }

  // 3. Check output format compliance
  if (step.outputFormat === "json") {
    try {
      JSON.parse(output);
    } catch {
      issues.push({
        severity: "high",
        category: "formatCompliance",
        message: "Output is not valid JSON"
      });
      dimensions.formatCompliance = 1;
    }
  } else if (step.outputFormat === "table") {
    if (!/\|.*\|/.test(output) && !/[\t|]/.test(output)) {
      issues.push({
        severity: "medium",
        category: "formatCompliance",
        message: "Table format not detected (expected markdown table or tabular structure)"
      });
      dimensions.formatCompliance -= 1.5;
    }
  }

  // 4. Check clarity - length and structure
  if (output.length < 50) {
    issues.push({
      severity: "medium",
      category: "clarity",
      message: "Output is very short; may lack sufficient detail"
    });
    dimensions.clarity -= 2;
  } else if (output.length > 5000) {
    issues.push({
      severity: "low",
      category: "clarity",
      message: "Output is quite long; consider if conciseness would improve clarity"
    });
    dimensions.clarity -= 0.5;
  }

  // 5. Check dependency usage
  if (previousOutputs.length > 0 && step.dependencies?.length) {
    const prevText = previousOutputs.join(" ").toLowerCase();
    const outputText = output.toLowerCase();
    // Check if output references concepts from previous steps
    const hasReference = step.dependencies.some(depId => {
      const depOutput = previousOutputs.find((_, i) => 
        step.dependencies?.[i] === depId
      );
      return depOutput && outputText.includes(depOutput.slice(0, 30).toLowerCase());
    });
    if (!hasReference) {
      issues.push({
        severity: "low",
        category: "dependencyUse",
        message: "Output does not appear to reference results from dependent steps"
      });
      dimensions.dependencyUse -= 1;
    }
  }

  // 6. Step-type specific checks
  if (step.stepType === "research" && !/source|reference|cite/i.test(output)) {
    issues.push({
      severity: "medium",
      category: "completeness",
      message: "Research output should cite sources or references"
    });
    dimensions.completeness -= 1;
  }

  // Instruction-specific quality checks
  if (step.stepType?.startsWith("instruction_") && step.stepType !== "instruction_assembly") {
    // Check for markdown headers
    if (!/^##?\s/m.test(output)) {
      issues.push({
        severity: "medium",
        category: "formatCompliance",
        message: "Instruction section should have markdown headers (## or ###)"
      });
      dimensions.formatCompliance -= 1;
    }
    // Check section completeness
    if (output.length < 150) {
      issues.push({
        severity: "medium",
        category: "completeness",
        message: "Instruction section is too short; expand with specific guidance"
      });
      dimensions.completeness -= 1.5;
    }
  }

  if (step.stepType === "instruction_assembly") {
    // Final assembly should be a complete instruction file
    if (!/#\s/.test(output)) {
      issues.push({
        severity: "high",
        category: "formatCompliance",
        message: "Final instruction file missing main title/header (# Title)"
      });
      dimensions.formatCompliance -= 2;
    }
    if (!/##\s*(Role|Context|Rules|Overview)/i.test(output)) {
      issues.push({
        severity: "high",
        category: "completeness",
        message: "Final assembly missing expected sections (Role, Context, Rules, or Overview)"
      });
      dimensions.completeness -= 2;
    }
  }

  if (step.stepType === "code" && !/(```|function|class|const|let|var)/.test(output)) {
    issues.push({
      severity: "medium",
      category: "formatCompliance",
      message: "Code output should include code blocks or syntax"
    });
    dimensions.formatCompliance -= 1;
  }

  // Calculate score
  const avgDimension = Object.values(dimensions).reduce((a, b) => a + b, 0) / 5;
  const highSeverityCount = issues.filter(i => i.severity === "high").length;
  const mediumSeverityCount = issues.filter(i => i.severity === "medium").length;
  
  let score = Math.round((avgDimension / 5) * 100);
  score -= highSeverityCount * 15;
  score -= mediumSeverityCount * 5;
  score = Math.max(0, Math.min(100, score));

  // LLM-based evaluation for nuanced quality assessment
  const llmEvaluation = await llmEvaluateStep(step, output, previousOutputs, modelConfig);
  
  // Merge LLM issues with rule-based issues
  issues.push(...llmEvaluation.issues);
  
  // Adjust dimensions based on LLM feedback
  llmEvaluation.dimensionAdjustments.forEach(({ dimension, delta }) => {
    dimensions[dimension] = Math.max(0, Math.min(5, dimensions[dimension] + delta));
  });

  return {
    score,
    dimensions,
    issues,
    suggestions: llmEvaluation.suggestions
  };
}

async function llmEvaluateStep(
  step: WorkflowStep,
  output: string,
  previousOutputs: string[],
  modelConfig: ModelConfig
): Promise<{
  issues: StepQualityIssue[];
  dimensionAdjustments: Array<{ dimension: StepQualityDimension; delta: number }>;
  suggestions: string[];
}> {
  const prompt = `Evaluate this workflow step output for quality issues.

Step Task: ${step.task}
Step Type: ${step.stepType || "analysis"}
Output Format: ${step.outputFormat || "markdown"}
Must Include: ${(step.mustInclude || []).join(", ") || "none"}
Must Avoid: ${(step.mustAvoid || []).join(", ") || "none"}
Quality Bar: ${step.qualityBar || "standard"}
Previous Step Outputs: ${previousOutputs.length > 0 ? "Yes" : "None"}

Output to Evaluate:
${output.slice(0, 2000)}${output.length > 2000 ? "\n... (truncated)" : ""}

Return JSON with this exact shape:
{
  "issues": [
    { "severity": "high|medium|low", "category": "clarity|completeness|formatCompliance|dependencyUse|safety", "message": "string" }
  ],
  "dimensionAdjustments": [
    { "dimension": "clarity|completeness|formatCompliance|dependencyUse|safety", "delta": number }
  ],
  "suggestions": ["string"]
}

Only flag real issues. Return empty arrays if output is good. Be concise.`;

  try {
    const response = await callAICC(
      [
        { role: "system", content: "You are a strict quality evaluator for AI-generated outputs. Only flag concrete issues." },
        { role: "user", content: prompt }
      ],
      modelConfig
    );
    
    const raw = extractAiccContent(response);
    const parsed = JSON.parse(raw) as {
      issues?: StepQualityIssue[];
      dimensionAdjustments?: Array<{ dimension: string; delta: number }>;
      suggestions?: string[];
    };

    return {
      issues: (parsed.issues || []).filter(i => 
        ["high", "medium", "low"].includes(i.severity) &&
        ["clarity", "completeness", "formatCompliance", "dependencyUse", "safety"].includes(i.category)
      ),
      dimensionAdjustments: (parsed.dimensionAdjustments || [])
        .filter(a => ["clarity", "completeness", "formatCompliance", "dependencyUse", "safety"].includes(a.dimension))
        .map(a => ({ dimension: a.dimension as StepQualityDimension, delta: a.delta })),
      suggestions: parsed.suggestions || []
    };
  } catch {
    // Return empty evaluation on error
    return {
      issues: [],
      dimensionAdjustments: [],
      suggestions: []
    };
  }
}

/**
 * Determine if output needs repair based on quality report
 */
export function needsRepair(report: StepQualityReport): boolean {
  return report.score < 85 || report.issues.some(i => i.severity === "high");
}

/**
 * Generate repair prompt based on quality issues
 */
export function generateRepairPrompt(
  step: WorkflowStep,
  originalOutput: string,
  report: StepQualityReport
): string {
  const highIssues = report.issues.filter(i => i.severity === "high");
  const mediumIssues = report.issues.filter(i => i.severity === "medium");
  
  let prompt = `The previous output for this step needs improvement.\n\n`;
  prompt += `Step Task: ${step.task}\n`;
  prompt += `Output Format: ${step.outputFormat || "markdown"}\n\n`;
  
  if (highIssues.length > 0) {
    prompt += `Critical Issues (MUST FIX):\n`;
    highIssues.forEach(i => prompt += `- ${i.message}\n`);
    prompt += `\n`;
  }
  
  if (mediumIssues.length > 0) {
    prompt += `Issues to Address:\n`;
    mediumIssues.forEach(i => prompt += `- ${i.message}\n`);
    prompt += `\n`;
  }
  
  if (report.suggestions.length > 0) {
    prompt += `Suggestions:\n`;
    report.suggestions.forEach(s => prompt += `- ${s}\n`);
    prompt += `\n`;
  }
  
  prompt += `Original Output:\n${originalOutput.slice(0, 1500)}\n\n`;
  prompt += `Provide a revised output that fixes all critical issues. Maintain the same format (${step.outputFormat || "markdown"}).`;
  
  return prompt;
}
