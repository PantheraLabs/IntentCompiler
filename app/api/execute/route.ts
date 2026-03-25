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

    const taskBlock = `TASK:
Execute this workflow step and return only the direct output for this step.
role: ${step.role}
task: ${step.task}

Previous outputs:
${previousOutputs.length ? previousOutputs.map((o, i) => `${i + 1}. ${o}`).join("\n") : "None"}`;

    const parsed = await callJsonWithValidation<{ output: string }>(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContextBlock },
        {
          role: "user",
          content: `${taskBlock}

Required JSON schema:
${JSON.stringify(executionSchema.schema)}`
        }
      ],
      executionSchema.schema,
      modelConfig
    );
    return NextResponse.json({ output: parsed.output || "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
