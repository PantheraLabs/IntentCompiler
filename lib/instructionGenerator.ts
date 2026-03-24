import { GenerateInstructionRequest } from "@/lib/types";

/**
 * Generates a markdown instruction file based on the provided request.
 * The output follows professional standards used for AI system prompts.
 */
export function generateInstructionMarkdown(request: GenerateInstructionRequest): string {
  const { intent, context, target } = request;
  const { project, audience, style, constraints } = context;

  const header = `# ${target.toUpperCase()} INSTRUCTION FILE`;

  const roleSection = `## 1. Role / Identity\nYou are an AI system specialized in ${style} style, serving ${audience}.`;

  const projectSection = `## 2. Project Overview\n${project}\n\n**Intent**: ${intent}`;

  const responsibilitiesSection = `## 3. Core Responsibilities\n- Follow the ${style} guidelines.\n- Address the audience: ${audience}.\n- Respect constraints: ${constraints.map((c) => `- ${c}`).join("\n")}`;

  const constraintsSection = `## 4. Constraints\n${constraints.map((c) => `- ${c}`).join("\n")}`;

  const output = [header, roleSection, projectSection, responsibilitiesSection, constraintsSection]
    .filter(Boolean)
    .join("\n\n");

  return output;
}
