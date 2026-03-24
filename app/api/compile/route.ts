import { NextResponse } from "next/server";
import { assertOpenAiKey, openai } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { UserContext } from "@/lib/types";

type CompileRequest = {
  intent: string;
  context: UserContext;
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
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "role", "task"],
          properties: {
            id: { type: "integer" },
            role: { type: "string" },
            task: { type: "string" }
          }
        }
      }
    }
  },
  strict: true
} as const;

export async function POST(req: Request) {
  try {
    assertOpenAiKey();
    const body = (await req.json()) as CompileRequest;
    const intent = body.intent?.trim();
    const context = body.context;

    if (!intent || !context) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const userContext = `USER CONTEXT:
project: ${context.project || ""}
audience: ${context.audience || ""}
depth: ${context.depth || ""}
style: ${context.style || ""}
constraints: ${(context.constraints || []).join(", ")}`;

    const task = `TASK:
Generate a 3-5 step executable workflow from the user intent and context.
Return JSON with { "steps": [{ "id": number, "role": string, "task": string }] }.
Ensure steps are in logical sequence and non-redundant.

INTENT:
${intent}`;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContext },
        { role: "user", content: task }
      ],
      text: {
        format: {
          type: "json_schema",
          name: stepsSchema.name,
          schema: stepsSchema.schema,
          strict: true
        }
      }
    });

    const raw = response.output_text;
    const parsed = JSON.parse(raw) as { steps: Array<{ id: number; role: string; task: string }> };

    const normalized = parsed.steps.slice(0, 5).map((step, index) => ({
      id: index + 1,
      role: String(step.role || "operator"),
      task: String(step.task || "")
    }));

    if (normalized.length < 3) {
      return NextResponse.json({ error: "Failed to compile enough steps." }, { status: 500 });
    }

    return NextResponse.json({ steps: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
