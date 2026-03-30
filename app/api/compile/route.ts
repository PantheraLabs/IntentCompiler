import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { randomUUID } from "crypto";
import type { ModelConfig, UserContext, WorkflowStep, Workflow } from "@/lib/types";
import { analyzeProject, recommendRoles, getWorkflowConfig } from "@/lib/roleMatcher";

type CompileRequest = {
  intent: string;
  context: UserContext;
  modelConfig?: Partial<ModelConfig>;
};

const stepsSchema = {
  name: "workflow_steps",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["steps"],
    properties: {
      steps: {
        type: "array",
        minItems: 4,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "role", "task", "status", "stepType", "sectionName"],
          properties: {
            id: { type: "integer" },
            role: { type: "string" },
            task: { type: "string" },
            status: { type: "string", enum: ["idle", "running", "success", "error"] },
            stepType: { type: "string", enum: ["instruction_role", "instruction_context", "instruction_rules", "instruction_assembly", "analysis", "research", "plan"] },
            sectionName: { type: "string" },
            outputFormat: { type: "string" },
            mustInclude: { type: "array", items: { type: "string" } },
            mustAvoid: { type: "array", items: { type: "string" } },
            acceptanceTests: { type: "array", items: { type: "string" } },
            qualityBar: { type: "string" }
          }
        }
      }
    }
  },
  strict: true
} as const;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompileRequest;
    const intent = body.intent?.trim();
    const context = body.context;
    const modelConfig = await resolveModelConfig(body.modelConfig, "structured");

    if (!intent || !context) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const userTier = (context.userTier || "free") as "free" | "premium";
    const analysis = analyzeProject(context);
    const workflowConfig = getWorkflowConfig(analysis, userTier);
    const roleRecommendations = recommendRoles(analysis, userTier);

    const userContext = `USER CONTEXT:
project: ${context.project || ""}
audience: ${context.audience || ""}
depth: ${context.depth || ""}
style: ${context.style || ""}
constraints: ${(context.constraints || []).join(", ")}
userTier: ${userTier}
projectComplexity: ${analysis.complexity}
recommendedRoles: ${roleRecommendations.map(r => r.role).join(", ")}`;

    const task = `TASK:
Generate a ${workflowConfig.maxSteps <= 12 ? workflowConfig.maxSteps : 8}-${Math.min(workflowConfig.maxSteps, 12)} step workflow that progressively builds an AI instruction file (like CLAUDE.md or .cursorrules) from the user intent and context.
Each step should generate one section of the final instruction file.

Project Analysis:
- Complexity: ${analysis.complexity}
- Domains: ${analysis.domain.join(", ")}
- Required Skills: ${analysis.requiredSkills.join(", ")}
- Team Size: ${analysis.teamSize}
- Risk Level: ${analysis.riskLevel}

Recommended Roles: ${roleRecommendations.map(r => `${r.role} (${Math.round(r.confidence * 100)}% confidence)`).join(", ")}

Section types to generate:
- instruction_role: Define the AI's role and responsibilities for this project
- instruction_context: Define project overview, tech stack, and architecture
- instruction_rules: Define rules, constraints, and execution guidelines  
- instruction_assembly: Combine all previous sections into final instruction file
- Additional sections as needed based on project complexity and requirements

Return JSON with { "steps": [{ "id": number, "role": string (use recommended roles), "task": string (generate the markdown content for this section), "status": "idle", "stepType": "instruction_role|instruction_context|instruction_rules|instruction_assembly|analysis|research|plan", "sectionName": string (e.g., "Role", "Context", "Rules", "Final"), "outputFormat": "markdown", "mustInclude": string[], "mustAvoid": string[], "acceptanceTests": string[], "qualityBar": string }] }.

Ensure steps build on each other logically. Use the recommended roles where appropriate. The final assembly step combines all previous outputs into a complete, formatted instruction file.
Acceptance criteria must ensure each section is complete and the final file is ready to use.

INTENT:
${intent}`;

    const parsed = await callJsonWithValidation<{
      steps: Array<{
        id: number;
        role: string;
        task: string;
        status?: "idle" | "running" | "success" | "error";
        outputFormat?: string;
        stepType?: string;
        sectionName?: string;
        mustInclude?: string[];
        mustAvoid?: string[];
        acceptanceTests?: string[];
        qualityBar?: string;
      }>;
    }>(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContext },
        {
          role: "user",
          content: `${task}

Required JSON schema:
${JSON.stringify(stepsSchema.schema)}`
        }
      ],
      stepsSchema.schema,
      modelConfig
    );

    // Generate steps with UUID-based IDs and create workflow structure
    const maxSteps = Math.min(parsed.steps.length, workflowConfig.maxSteps);
    const stepIds: string[] = Array(maxSteps).fill(0).map(() => randomUUID());
    const steps: WorkflowStep[] = parsed.steps.slice(0, maxSteps).map((step, index) => ({
      id: stepIds[index]!,
      role: String(step.role || roleRecommendations[index]?.role || "instruction_compiler"),
      task: String(step.task || ""),
      status: "idle" as const,
      stepType: (step.stepType || "analysis") as WorkflowStep["stepType"],
      sectionName: step.sectionName || `Section ${index + 1}`,
      outputFormat: "markdown" as const,
      mustInclude: Array.isArray(step.mustInclude) ? step.mustInclude : [],
      mustAvoid: Array.isArray(step.mustAvoid) ? step.mustAvoid : [],
      acceptanceTests: Array.isArray(step.acceptanceTests) ? step.acceptanceTests : [],
      qualityBar: typeof step.qualityBar === "string" ? step.qualityBar : "",
      dependencies: index > 0 ? [stepIds[index - 1]!] : undefined
    }));

    if (steps.length < 4) {
      return NextResponse.json({ error: "Failed to compile enough steps." }, { status: 500 });
    }

    // Create sequential edges between steps
    const edges = steps.slice(0, -1).map((step, index) => ({
      from: step.id,
      to: steps[index + 1]?.id || step.id
    }));

    const workflow: Workflow = {
      id: randomUUID(),
      name: `Workflow for: ${intent.slice(0, 50)}${intent.length > 50 ? "..." : ""}`,
      intent,
      context,
      steps,
      edges,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      workflow, 
      steps, 
      modelConfig, 
      analysis,
      roleRecommendations,
      workflowConfig 
    });
  } catch (error) {
    console.error("[COMPILE_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
