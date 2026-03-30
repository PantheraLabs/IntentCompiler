import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { evaluateCondition, isStepReady, type ExecutionContext } from "@/lib/executionEngine";
import { executeTool } from "@/lib/registry";
import { evaluateStepQuality, needsRepair, generateRepairPrompt } from "@/lib/stepQuality";
import type { ModelConfig, UserContext, WorkflowStep } from "@/lib/types";

type ExecuteRequest = {
  step: WorkflowStep;
  previousOutputs: string[];
  stepOutputs?: Map<string, string>;
  userContext?: UserContext;
  modelConfig?: Partial<ModelConfig>;
  executionContext?: ExecutionContext;
};

const executionSchema = {
  name: "execution_result",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["output"],
    properties: {
      output: { type: "string" }
    }
  },
  strict: true
} as const;

type ExecuteResponse = { 
  output?: string; 
  warnings?: string[]; 
  attempts?: number; 
  error?: string; 
  metadata?: Record<string, unknown>;
  quality?: { score: number; issues: number };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExecuteRequest;
    const { step, previousOutputs, userContext, stepOutputs } = body;
    const modelConfig = await resolveModelConfig(body.modelConfig, "complex");

    // Convert stepOutputs from plain object to Map if needed
    const stepOutputsMap = stepOutputs ? 
      (stepOutputs instanceof Map ? stepOutputs : new Map(Object.entries(stepOutputs as Record<string, string>))) :
      undefined;

    if (!step?.task) {
      return NextResponse.json({ error: "Invalid step." }, { status: 400 });
    }

    // Check if step should be skipped due to condition
    if (step.condition && stepOutputsMap) {
      const conditionMet = evaluateCondition(step.condition.if, stepOutputsMap);
      const shouldExecute = conditionMet ? step.id === step.condition.then : step.id === step.condition.else;
      
      if (!shouldExecute) {
        return NextResponse.json({ 
          output: "[skipped - condition not met]", 
          status: "skipped",
          warnings: [],
          attempts: 0
        });
      }
    }

    // Check dependencies are satisfied
    if (step.dependencies && step.dependencies.length > 0 && stepOutputsMap) {
      const depsSatisfied = step.dependencies.every(dep => stepOutputsMap.has(dep));
      
      if (!depsSatisfied) {
        return NextResponse.json({ 
          error: `Dependencies not satisfied: ${step.dependencies.filter(d => !stepOutputsMap?.has(d)).join(", ")}` 
        }, { status: 400 });
      }
    }

    // Execute tool if configured (non-LLM mode)
    let toolOutput = "";
    let toolMetadata = {};
    
    if (step.tool && step.tool.mode !== "llm") {
      const toolResult = await executeTool(step.tool as unknown as Parameters<typeof executeTool>[0]);
      toolMetadata = toolResult.metadata || {};
      
      if (!toolResult.success) {
        return NextResponse.json({ 
          output: "", 
          error: `Tool execution failed: ${toolResult.error}`,
          warnings: [],
          attempts: 1
        } satisfies ExecuteResponse);
      }
      
      toolOutput = toolResult.output;
      
      // If tool-only mode (no LLM post-processing), return directly
      if (step.tool.mode === "shell" || step.tool.mode === "http" || step.tool.mode === "file") {
        return NextResponse.json({ 
          output: toolOutput, 
          warnings: [],
          attempts: 1,
          metadata: toolMetadata
        } satisfies ExecuteResponse);
      }
    }

    const userContextBlock = `USER CONTEXT:
project: ${userContext?.project || ""}
audience: ${userContext?.audience || ""}
depth: ${userContext?.depth || ""}
style: ${userContext?.style || ""}
tone: ${userContext?.tone || ""}
constraints: ${(userContext?.constraints || []).join(", ") || "none"}`;

    const stepTypeGuidance = (() => {
      switch (step.stepType) {
        case "instruction_role":
          return "Generate markdown content for the ## Role section. Define the AI's persona, expertise level, and primary responsibilities for this project.";
        case "instruction_context":
          return "Generate markdown content for the ## Context section. Include project overview, tech stack, architecture, and audience.";
        case "instruction_rules":
          return "Generate markdown content for the ## Rules section. Define coding standards, constraints, and execution guidelines.";
        case "instruction_assembly":
          return "Combine all previous section outputs into a complete, formatted instruction file (CLAUDE.md/.cursorrules format). Add headers and ensure consistency.";
        case "research":
          return "Provide concise findings with a short sources list placeholder.";
        case "write":
          return "Write polished prose with clear structure and headings if needed.";
        case "analysis":
          return "Return structured analysis with clear conclusions.";
        default:
          return "Return structured markdown content.";
      }
    })();

    const taskBlock = `TASK:
Execute this workflow step and return only the direct output for this step.
role: ${step.role}
task: ${step.task}
step_type: ${step.stepType || "analysis"}
guidance: ${stepTypeGuidance}
output_format: ${step.outputFormat || "markdown"}
must_include: ${(step.mustInclude || []).join("; ") || "none"}
must_avoid: ${(step.mustAvoid || []).join("; ") || "none"}
acceptance_tests: ${(step.acceptanceTests || []).join("; ") || "none"}
quality_bar: ${step.qualityBar || "none"}
${toolOutput ? `\nTool output to process:\n${toolOutput}` : ""}

Previous outputs:
${previousOutputs.length ? previousOutputs.map((o, i) => `${i + 1}. ${o}`).join("\n") : "None"}`;

    const baseMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: userContextBlock },
      {
        role: "user" as const,
        content: `${taskBlock}

Required JSON schema:
${JSON.stringify(executionSchema.schema)}`
      }
    ];

    const checkOutput = (output: string) => {
      const warnings: string[] = [];
      const normalized = output.toLowerCase();

      if (step.mustInclude?.length) {
        const missing = step.mustInclude.filter((item) => !normalized.includes(item.toLowerCase()));
        if (missing.length) warnings.push(`Missing required items: ${missing.join(", ")}`);
      }
      if (step.mustAvoid?.length) {
        const present = step.mustAvoid.filter((item) => normalized.includes(item.toLowerCase()));
        if (present.length) warnings.push(`Contains forbidden items: ${present.join(", ")}`);
      }
      if (step.outputFormat === "json") {
        try {
          JSON.parse(output);
        } catch {
          warnings.push("Output is not valid JSON.");
        }
      }

      if (step.stepType === "research") {
        if (!/sources?/i.test(output)) {
          warnings.push("Research output should include a Sources section.");
        }
      }
      if (step.stepType?.startsWith("instruction_") && step.stepType !== "instruction_assembly") {
        // Check for markdown heading structure
        if (!/^##?\s/m.test(output)) {
          warnings.push("Instruction section should have markdown headers.");
        }
        if (output.length < 100) {
          warnings.push("Instruction section seems too short; expand the content.");
        }
      }
      if (step.stepType === "instruction_assembly") {
        // Final assembly should be a complete instruction file
        if (!/#\s/.test(output)) {
          warnings.push("Final instruction file should have a main title/header.");
        }
        if (!/##\s*(Role|Context|Rules|Overview)/i.test(output)) {
          warnings.push("Final assembly missing expected sections (Role, Context, Rules).");
        }
      }
      return warnings;
    };

    let attempts = 0;
    let output = "";
    let warnings: string[] = [];
    let messages = baseMessages;
    let qualityReport: Awaited<ReturnType<typeof evaluateStepQuality>> | null = null;

    while (attempts < 3) {
      attempts += 1;
      const parsed = await callJsonWithValidation<{ output: string }>(messages, executionSchema.schema, modelConfig);
      output = parsed.output || "";
      warnings = checkOutput(output);
      
      // Critic: Evaluate quality
      qualityReport = await evaluateStepQuality(step, output, previousOutputs, modelConfig);
      
      // If basic checks pass and quality is good, we're done
      if (!warnings.length && !needsRepair(qualityReport)) {
        break;
      }
      
      // Repair: Add feedback to improve output
      if (attempts < 3) {
        const repairFeedback = generateRepairPrompt(step, output, qualityReport);
        messages = messages.concat({
          role: "user",
          content: `${repairFeedback}\n\nBasic check issues: ${warnings.join("; ") || "none"}. Return improved JSON only.`
        });
      }
    }

    // Final quality-based warnings
    const finalWarnings = [
      ...warnings,
      ...(qualityReport?.issues.filter(i => i.severity === "high").map(i => i.message) || [])
    ];

    return NextResponse.json({ 
      output, 
      warnings: finalWarnings, 
      attempts,
      quality: qualityReport ? {
        score: qualityReport.score,
        issues: qualityReport.issues.length
      } : undefined
    } satisfies ExecuteResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
