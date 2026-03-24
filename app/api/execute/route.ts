import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { UserContext, WorkflowStep } from "@/lib/types";

type ExecuteRequest = {
  step: WorkflowStep;
  previousOutputs: { stepId: number; output: string }[];
  userContext?: UserContext;
  shouldSummarize?: boolean;
};

const executionSchema = {
  name: "execution_result",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["output"],
    properties: {
      output: { type: "string" },
      summary: { type: "string", description: "A brief summary of what was accomplished in this step (optional)." }
    }
  },
  strict: true
} as const;

export async function POST(req: Request) {
  try {
    const openai = getOpenAIClient();
    const body = (await req.json()) as ExecuteRequest;
    const { step, previousOutputs, userContext, shouldSummarize } = body;

    if (!step?.task) {
      return NextResponse.json({ error: "Invalid step." }, { status: 400 });
    }

    const contextContent = userContext ? `
PROJECT: ${userContext.project}
AUDIENCE: ${userContext.audience}
DEPTH: ${userContext.depth}
STYLE: ${userContext.style}
CONSTRAINTS: ${userContext.constraints?.join(", ") || "None"}
`.trim() : "None";

    const historyContent = previousOutputs.length > 0
      ? previousOutputs.map((o, i) => `[Step ${o.stepId} Output]:\n${o.output}`).join("\n\n---\n\n")
      : "No previous steps.";

    const systemPrompt = `${SYSTEM_PROMPT}

As the Execution Engine, your goal is to fulfill the current task while maintaining continuity with previous work.
If 'shouldSummarize' is true, provide a concise 'summary' field in your response that captures the essence of your output for future steps.

${shouldSummarize ? "Please provide a 'summary' of your output to help keep future context windows clean." : ""}`;

    const taskContent = `
=== USER CONTEXT ===
${contextContent}

=== EXECUTION HISTORY ===
${historyContent}

=== CURRENT TASK ===
Role: ${step.role}
Instruction: ${step.task}

Execute this task and return the result in the specified JSON format.
`.trim();

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: taskContent }
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

    const parsed = JSON.parse(response.output_text) as { output: string; summary?: string };

    return NextResponse.json({
      output: parsed.output || "",
      summary: parsed.summary || ""
    });
  } catch (error) {
    console.error("Execution error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
