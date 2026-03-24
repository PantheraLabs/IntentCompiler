/**
 * Provides system prompts and instructions for generating high-quality
 * AI instruction markdown files (CLAUDE.md, AGENTS.md, etc.)
 */

export function getInstructionSystemPrompt(target: "claude" | "agents" | "generic"): string {
  const formats = {
    claude: "CLAUDE.md style for Claude Dev / Anthropic agents. Focus on project structure, CLI commands, and specific behavior rules.",
    agents: "AGENTS.md style for multi-agent systems. Focus on role definition, collaboration, and tool usage.",
    generic: "General INSTRUCTIONS.md for any AI agent. Focus on clear project overview and core responsibilities."
  };

  return `You are a Senior AI Systems Engineer specialized in context engineering for LLMs.
Your goal is to generate a highly detailed and descriptive AI instruction markdown file based on the provided intent and project context.

The output MUST be a professional system prompt that allows another AI agent to immediately understand the project, its goals, and constraints.

Target Format: ${formats[target]}

Include these sections:
1. Role / Identity: A deep definition of the AI's persona, expertise, and communication style.
2. Project Overview: Detailed explanation of the project, purpose, and tech stack if applicable.
3. Core Responsibilities: Comprehensive list of high-level and granular tasks.
4. Rules & Constraints: Strict limitations, coding standards, and best practices.
5. Setup / CLI / Tools: Typical commands, environment setup, or tools to be used.

Respond ONLY with the Markdown content. Do not include conversational text.`;
}

export function getInstructionUserPrompt(
  intent: string,
  project: string,
  audience: string,
  style: string,
  constraints: string[]
): string {
  return `Generate the instruction file with the following details:
- **Project Context**: ${project}
- **Main Goal/Intent**: ${intent}
- **Target Audience**: ${audience}
- **Desired Style/Tone**: ${style}
- **Strict Constraints**:
${constraints.length > 0 ? constraints.map(c => `- ${c}`).join("\n") : "- None specified"}

Make it descriptive, authoritative, and ready for immediate use by an AI assistant.`;
}
