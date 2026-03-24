import { access, readFile } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { callAICC, extractAiccContent } from "@/lib/aicc";
import type { ModelConfig } from "@/lib/types";

type QualitySeverity = "high" | "medium" | "low";

export type QualityIssue = {
  severity: QualitySeverity;
  category: "correctness" | "specificity" | "executability" | "safety" | "compatibility" | "brevity";
  message: string;
};

export type InstructionQualityReport = {
  score: number;
  dimensions: {
    correctness: number;
    specificity: number;
    executability: number;
    safety: number;
    compatibility: number;
    brevity: number;
  };
  issues: QualityIssue[];
};

type EvaluateInput = {
  markdown: string;
  target: "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
  projectRoot: string;
};

type ImproveInput = {
  markdown: string;
  target: EvaluateInput["target"];
  modelConfig: ModelConfig;
  quality: InstructionQualityReport;
};

function clamp(value: number, min = 0, max = 5) {
  return Math.min(max, Math.max(min, value));
}

function extractBashCommands(markdown: string) {
  const commandBlocks: string[] = [];
  const regex = /```(?:bash|sh|zsh|shell)?\n([\s\S]*?)```/gi;
  for (const match of markdown.matchAll(regex)) {
    if (match[1]) commandBlocks.push(match[1]);
  }

  const commands: string[] = [];
  commandBlocks.forEach((block) => {
    block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .forEach((line) => {
        const parts = line.split(/[|;&]/).map((part) => part.trim()).filter(Boolean);
        commands.push(...parts);
      });
  });
  return commands;
}

function extractLikelyPaths(markdown: string) {
  const matches = markdown.match(/`([^`]+)`/g) ?? [];
  return matches
    .map((item) => item.slice(1, -1).trim())
    .filter((value) => value.includes("/") || value.includes("\\") || /\.\w{1,6}$/i.test(value))
    .filter((value) => !value.startsWith("http://") && !value.startsWith("https://"));
}

async function validateCommands(commands: string[], projectRoot: string) {
  const issues: QualityIssue[] = [];
  let scripts: Record<string, string> = {};
  try {
    const pkgRaw = await readFile(path.join(projectRoot, "package.json"), "utf8");
    const parsed = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
    scripts = parsed.scripts || {};
  } catch {
    scripts = {};
  }

  for (const command of commands) {
    const normalized = command.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    if (/^(rm|del|format|mkfs|shutdown)\b/i.test(normalized)) {
      issues.push({
        severity: "high",
        category: "safety",
        message: `Potentially destructive command in instructions: "${normalized}".`
      });
    }
    const npmRun = normalized.match(/^npm(?:\.cmd)? run ([\w:-]+)/i);
    if (npmRun?.[1] && !scripts[npmRun[1]]) {
      issues.push({
        severity: "medium",
        category: "executability",
        message: `Command references missing npm script: "${npmRun[1]}".`
      });
    }
  }

  return issues;
}

async function validatePaths(paths: string[], projectRoot: string) {
  const issues: QualityIssue[] = [];
  const uniquePaths = Array.from(new Set(paths));

  for (const maybePath of uniquePaths) {
    if (maybePath.includes("*") || maybePath.startsWith("$")) continue;
    const relativePath = maybePath.startsWith("/") || /^[A-Za-z]:\\/.test(maybePath)
      ? path.relative(projectRoot, maybePath)
      : maybePath;
    const fullPath = path.resolve(projectRoot, relativePath);
    try {
      await access(fullPath, constants.F_OK);
    } catch {
      issues.push({
        severity: "low",
        category: "correctness",
        message: `Referenced path may not exist in repo: "${maybePath}".`
      });
    }
  }
  return issues;
}

function evaluateStructure(markdown: string, target: EvaluateInput["target"]) {
  const issues: QualityIssue[] = [];
  const requiredSections = ["## Role", "## Project Overview", "## Responsibilities", "## Rules & Standards"];
  requiredSections.forEach((heading) => {
    if (!markdown.includes(heading)) {
      issues.push({
        severity: "high",
        category: "compatibility",
        message: `Missing required section: ${heading}.`
      });
    }
  });

  const targetName =
    target === "claude"
      ? "CLAUDE.md"
      : target === "agents"
        ? "AGENTS.md"
        : target === "gemini"
          ? "GEMINI.md"
          : target === "cursor"
            ? ".cursorrules"
            : target === "windsurf"
              ? ".windsurfrules"
              : "INSTRUCTIONS.md";
  if (!markdown.startsWith(`# ${targetName}`)) {
    issues.push({
      severity: "medium",
      category: "compatibility",
      message: `Top heading should be "# ${targetName}".`
    });
  }

  if (markdown.length > 8000) {
    issues.push({
      severity: "medium",
      category: "brevity",
      message: "Instruction file is long and may reduce usability."
    });
  }

  return issues;
}

export async function evaluateInstructionMarkdown({ markdown, target, projectRoot }: EvaluateInput) {
  const issues: QualityIssue[] = [];
  issues.push(...evaluateStructure(markdown, target));

  const commands = extractBashCommands(markdown);
  if (commands.length === 0) {
    issues.push({
      severity: "medium",
      category: "executability",
      message: "No executable command examples found."
    });
  }
  issues.push(...(await validateCommands(commands, projectRoot)));
  issues.push(...(await validatePaths(extractLikelyPaths(markdown), projectRoot)));

  const highCount = issues.filter((issue) => issue.severity === "high").length;
  const mediumCount = issues.filter((issue) => issue.severity === "medium").length;
  const lowCount = issues.filter((issue) => issue.severity === "low").length;

  const dimensions = {
    correctness: clamp(5 - highCount * 1.2 - lowCount * 0.3),
    specificity: clamp(markdown.includes("constraints") ? 4.6 : 3.2),
    executability: clamp(5 - mediumCount * 0.8 - highCount * 0.5),
    safety: clamp(5 - highCount * 1.1),
    compatibility: clamp(5 - highCount * 0.9 - mediumCount * 0.6),
    brevity: clamp(markdown.length > 8000 ? 2.6 : markdown.length > 5500 ? 3.6 : 4.7)
  };

  const score =
    Math.round(
      ((dimensions.correctness +
        dimensions.specificity +
        dimensions.executability +
        dimensions.safety +
        dimensions.compatibility +
        dimensions.brevity) /
        30) *
        100
    );

  return { score, dimensions, issues } as InstructionQualityReport;
}

function needsAutoFix(report: InstructionQualityReport) {
  return report.score < 85 || report.issues.some((issue) => issue.severity === "high");
}

export async function improveInstructionMarkdown({ markdown, target, modelConfig, quality }: ImproveInput) {
  if (!needsAutoFix(quality)) {
    return markdown;
  }

  const criticPrompt = `You are improving an AI instruction file.
Target file type: ${target}
Current quality score: ${quality.score}/100
Issues:
${quality.issues.map((issue) => `- [${issue.severity}] (${issue.category}) ${issue.message}`).join("\n")}

Rewrite the file to fix all issues while preserving intent and structure.
Constraints:
- Keep markdown format.
- Do not include dangerous/destructive commands.
- Prefer concrete and executable guidance.
- Keep the response concise but complete.

Return JSON only with shape:
{"markdown":"<improved markdown>"}.

Current markdown:
${markdown}`;

  try {
    const response = await callAICC(
      [
        { role: "system", content: "You are a strict technical editor for AI instruction files." },
        { role: "user", content: criticPrompt }
      ],
      modelConfig
    );
    const raw = extractAiccContent(response);
    const parsed = JSON.parse(raw) as { markdown?: string };
    return parsed.markdown?.trim() ? parsed.markdown : markdown;
  } catch {
    return markdown;
  }
}

