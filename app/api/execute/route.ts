import { NextResponse } from "next/server";
import { assertOpenAiKey, openai } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { UserContext, WorkflowStep } from "@/lib/types";

type ExecuteRequest = {
  step: WorkflowStep;
  previousOutputs: string[];
  userContext?: UserContext;
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
    assertOpenAiKey();
    const body = (await req.json()) as ExecuteRequest;
    const step = body.step;
    const previousOutputs = Array.isArray(body.previousOutputs) ? body.previousOutputs : [];
    const userContext = body.userContext;

    if (!step?.task) {
      return NextResponse.json({ error: "Invalid step." }, { status: 400 });
    }

    const userContextBlock = `USER CONTEXT:
project: ${userContext?.project || ""}
audience: ${userContext?.audience || ""}
depth: ${userContext?.depth || ""}
style: ${userContext?.style || ""}
constraints: ${(userContext?.constraints || []).join(", ")}`;

    const taskBlock = `TASK:
Execute this workflow step.
role: ${step.role}
task: ${step.task}

Previous step outputs:
${previousOutputs.length ? previousOutputs.map((o, i) => `${i + 1}. ${o}`).join("\n") : "None"}`;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContextBlock },
        { role: "user", content: taskBlock }
      ],
      text: {
        format: {
          type: "json_schema",
          name: executionSchema.name,
          schema: executionSchema.schema,
          strict: true
        }
      }
    });

    const parsed = JSON.parse(response.output_text) as { output: string };

    return NextResponse.json({
      output: parsed.output || ""
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
