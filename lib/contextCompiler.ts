import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { BehaviorDefinition, IntentRefinement, StructuredContext, UserContext } from "@/lib/types";

export const refinementSchema = {
  type: "object",
  additionalProperties: false,
  required: ["interpreted_intent", "assumptions", "clarified_goal"],
  properties: {
    interpreted_intent: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    clarified_goal: { type: "string" }
  }
} as const;

export const contextSchema = {
  type: "object",
  additionalProperties: false,
  required: ["project", "audience", "tech_stack", "constraints"],
  properties: {
    project: { type: "string" },
    audience: { type: "string" },
    tech_stack: { type: "string" },
    constraints: { type: "array", items: { type: "string" } }
  }
} as const;

export const behaviorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "objectives", "rules", "execution_style", "output_format"],
  properties: {
    role: { type: "string" },
    objectives: { type: "array", items: { type: "string" } },
    rules: { type: "array", items: { type: "string" } },
    execution_style: { type: "string" },
    output_format: { type: "string" }
  }
} as const;

export function buildUserContextBlock(intent: string, userContext: UserContext) {
  return `USER CONTEXT:
intent: ${intent}
project: ${userContext.project || ""}
audience: ${userContext.audience || ""}
depth: ${userContext.depth || ""}
style: ${userContext.style || ""}
tone: ${userContext.tone || ""}
constraints: ${(userContext.constraints || []).join(", ") || "none"}`;
}

export function buildRefinementTask(intent: string) {
  return `TASK:
Refine vague user intent into a clear project objective.
Return JSON only.

Input idea:
${intent}`;
}

export function buildContextTask(refinement: IntentRefinement, userContext: UserContext) {
  return `TASK:
Create structured project context from refined intent and provided context.
Return JSON only.

Refined intent:
${refinement.clarified_goal}

Assumptions:
${refinement.assumptions.join("; ") || "none"}

Raw user context:
project=${userContext.project || ""}
audience=${userContext.audience || ""}
style=${userContext.style || ""}
constraints=${(userContext.constraints || []).join(", ") || "none"}`;
}

export function buildBehaviorTask(refinement: IntentRefinement, context: StructuredContext, target: "claude" | "agents" | "generic") {
  return `TASK:
Compile AI behavior definition for a persistent instruction file (${target.toUpperCase()}).
Return JSON only.

Clarified goal:
${refinement.clarified_goal}

Structured context:
project=${context.project}
audience=${context.audience}
tech_stack=${context.tech_stack}
constraints=${context.constraints.join(", ") || "none"}`;
}

export function createInstructionMarkdown(
  target: "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic",
  refinement: IntentRefinement,
  context: StructuredContext,
  behavior: BehaviorDefinition
) {
  const fileNames = {
    claude: "CLAUDE.md",
    agents: "AGENTS.md",
    gemini: "GEMINI.md",
    cursor: ".cursorrules",
    windsurf: ".windsurfrules",
    generic: "INSTRUCTIONS.md"
  };
  const fileName = fileNames[target];
  const list = (items: string[]) => (items.length ? items.map((item) => `- ${item}`).join("\n") : "- None");

  let content = `# ${fileName}

## Role
${behavior.role}

## Project Overview
- **Project**: ${context.project}
- **Audience**: ${context.audience}
- **Clarified Goal**: ${refinement.clarified_goal}
- **Tech Stack**: ${context.tech_stack}

## Responsibilities
${list(behavior.objectives)}

## Rules & Standards
${list(behavior.rules)}

## Architecture & Constraints
${list(context.constraints)}

## Key Assumptions
${list(refinement.assumptions)}

## Execution Guidelines
${behavior.execution_style}

## Output Format
${behavior.output_format}
`;

  // Specialized sections based on research
  if (target === "claude" || target === "agents") {
    content += `
## Guardrails
- **Do NOT** deviate from the established tech stack: ${context.tech_stack}
- **Always** verify changes against initial project intent: ${refinement.interpreted_intent}
- Maintain strict single-responsibility principles for all new modules.
`;
  }

  if (target === "gemini") {
    content += `
## <PROTOCOL>
### PHASE:PLAN
- Review assumptions: ${refinement.assumptions.join(", ")}
- Outline architectural impact before implementation.

### PHASE:IMPLEMENT
- Adhere to the defined Tech Stack: ${context.tech_stack}
- Follow local standards: ${behavior.rules.join(", ")}
`;
  }

  if (target === "cursor" || target === "windsurf") {
    content += `
## IDE Specific Context
- **Context Awareness**: Use the local file map to maintain consistency with: ${context.project}
- **Workflow**: Create a plan before significant changes. Use \`PLAN.md\` for complex tasks.
`;
  }

  return content;
}

export function systemContextBlock() {
  return SYSTEM_PROMPT;
}
