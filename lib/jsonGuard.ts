import Ajv, { type ErrorObject, type JSONSchemaType } from "ajv";
import { callAICC, extractAiccContent } from "@/lib/aicc";
import type { ModelConfig } from "@/lib/types";

const ajv = new Ajv({ allErrors: true, strict: false });

export type JsonValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: ErrorObject[] | null | undefined; raw: string };

export function validateJson<T>(schema: JSONSchemaType<T> | object, data: unknown): JsonValidationResult<T> {
  const validate = ajv.compile(schema as object);
  const ok = validate(data);
  if (ok) {
    return { ok: true, data: data as T };
  }
  return { ok: false, errors: validate.errors, raw: JSON.stringify(data) };
}

function formatErrors(errors: ErrorObject[] | null | undefined) {
  if (!errors?.length) return "Unknown schema validation error.";
  return errors
    .slice(0, 6)
    .map((err) => `${err.instancePath || "<root>"} ${err.message ?? "invalid"}`.trim())
    .join("; ");
}

export async function callJsonWithValidation<T>(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  schema: object,
  modelConfig: ModelConfig,
  maxAttempts = 2
) {
  let lastRaw = "";
  let attempt = 0;
  let currentMessages = [...messages];

  while (attempt < maxAttempts) {
    attempt += 1;
    const response = await callAICC(currentMessages, modelConfig);
    const raw = extractAiccContent(response);
    lastRaw = raw;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      const parseError = err instanceof Error ? err.message : "Invalid JSON";
      if (attempt < maxAttempts) {
        currentMessages = currentMessages.concat({
          role: "user",
          content: `Your response was not valid JSON (error: ${parseError}). Return JSON only that matches the schema.`
        });
        continue;
      }
      throw new Error(`Failed to parse JSON after ${attempt} attempts.`);
    }

    const validation = validateJson<T>(schema, parsed);
    if (validation.ok) {
      return validation.data;
    }

    if (attempt < maxAttempts) {
      currentMessages = currentMessages.concat({
        role: "user",
        content: `Your JSON did not match the schema. Validation errors: ${formatErrors(validation.errors)}. Return JSON only that matches the schema.`
      });
      continue;
    }

    throw new Error(`Schema validation failed after ${attempt} attempts. Raw response: ${lastRaw.slice(0, 2000)}`);
  }

  throw new Error("Unexpected JSON validation failure.");
}
