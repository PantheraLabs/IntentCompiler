import { NextResponse } from "next/server";
import { resolveModelConfig } from "@/lib/aicc";
import { callJsonWithValidation } from "@/lib/jsonGuard";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { ModelConfig, UserContext } from "@/lib/types";

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
    const body = (await req.json()) as CompileRequest;
    const intent = body.intent?.trim();
    const context = body.context;
    const modelConfig = resolveModelConfig(body.modelConfig, "structured");

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
Return JSON with { "steps": [{ "id": number, "role": string, "task": string, "status": "idle" }] }.
Ensure steps are in logical sequence and non-redundant.

INTENT:
${intent}`;

    const parsed = await callJsonWithValidation<{
      steps: Array<{ id: number; role: string; task: string; status?: "idle" | "running" | "success" | "error" }>;
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

    const normalized = parsed.steps.slice(0, 5).map((step, index) => ({
      id: index + 1,
      role: String(step.role || "operator"),
      task: String(step.task || ""),
      status: "idle" as const
    }));

    if (normalized.length < 3) {
      return NextResponse.json({ error: "Failed to compile enough steps." }, { status: 500 });
    }

    return NextResponse.json({ steps: normalized, modelConfig });
  } catch (error) {
    console.error("[COMPILE_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
