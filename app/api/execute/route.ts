import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { ModelConfig, UserContext, WorkflowStep } from "@/lib/types";

type ExecuteRequest = {
  step: WorkflowStep;
  previousOutputs: string[];
  userContext?: UserContext;
  modelConfig?: Partial<ModelConfig>;
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

type ExecuteResponse = { output?: string; warnings?: string[]; attempts?: number; error?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExecuteRequest;
    const { step, previousOutputs, userContext } = body;
    const modelConfig = resolveModelConfig(body.modelConfig, "complex");

    if (!step?.task) {
      return NextResponse.json({ error: "Invalid step." }, { status: 400 });
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
        case "research":
          return "Provide concise findings with a short sources list placeholder.";
        case "code":
          return "Return patch-ready code or explicit file-level instructions.";
        case "write":
          return "Write polished prose with clear structure and headings if needed.";
        case "plan":
          return "Return an ordered checklist with dependencies.";
        default:
          return "Return structured analysis with clear conclusions.";
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
      if (step.stepType === "code") {
        if (!/(file|path|diff)/i.test(output)) {
          warnings.push("Code output should reference file paths or a diff.");
        }
      }
      if (step.stepType === "plan") {
        if (!/^\s*\d+\./m.test(output)) {
          warnings.push("Plan output should be an ordered list.");
        }
      }
      if (step.stepType === "write") {
        if (output.length < 200) {
          warnings.push("Write output seems too short; expand the content.");
        }
      }
      return warnings;
    };

    let attempts = 0;
    let output = "";
    let warnings: string[] = [];
    let messages = baseMessages;

    while (attempts < 2) {
      attempts += 1;
      const parsed = await callJsonWithValidation<{ output: string }>(messages, executionSchema.schema, modelConfig);
      output = parsed.output || "";
      warnings = checkOutput(output);
      if (!warnings.length) break;
      messages = messages.concat({
        role: "user",
        content: `The output failed acceptance checks: ${warnings.join("; ")}. Revise the output to satisfy all checks. Return JSON only.`
      });
    }

    return NextResponse.json({ output, warnings, attempts } satisfies ExecuteResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
