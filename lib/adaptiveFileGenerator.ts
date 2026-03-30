/**
 * Adaptive File Generator - Generates single or multiple instruction files
 * based on project complexity and domain analysis
 */

import type { UserContext, WorkflowStep } from "./types";
import { analyzeProjectInput, type ProjectAnalysis } from "./projectAnalyzer";
import { assembleInstruction, scoreInstruction, type InstructionTarget, type InstructionQuality } from "./instructionAssembler";

export interface GeneratedFile {
  name: string;
  type: string;
  content: string;
  quality: InstructionQuality;
  dependencies: string[];
}

export interface ProjectOutput {
  analysis: ProjectAnalysis;
  files: GeneratedFile[];
  isMultiFile: boolean;
  totalQuality: number;
}

// File type configurations
const FILE_CONFIGS: Record<string, {
  prefix: string;
  name: string;
  description: string;
  sections: string[];
}> = {
  comprehensive: {
    prefix: "",
    name: "CLAUDE.md",
    description: "Comprehensive instruction file",
    sections: ["role", "context", "rules", "setup", "workflow"]
  },
  architecture: {
    prefix: "01-",
    name: "ARCHITECTURE.md",
    description: "System architecture and design patterns",
    sections: ["overview", "architecture", "patterns", "decisions"]
  },
  frontend: {
    prefix: "02-",
    name: "FRONTEND.md",
    description: "Frontend components and UI guidelines",
    sections: ["components", "styling", "state", "routing"]
  },
  backend: {
    prefix: "03-",
    name: "BACKEND.md",
    description: "Backend services and API design",
    sections: ["api", "services", "middleware", "error-handling"]
  },
  database: {
    prefix: "04-",
    name: "DATABASE.md",
    description: "Database schemas and data models",
    sections: ["schema", "models", "migrations", "optimization"]
  },
  authentication: {
    prefix: "05-",
    name: "AUTHENTICATION.md",
    description: "Authentication and security",
    sections: ["auth", "security", "permissions", "sessions"]
  },
  deployment: {
    prefix: "06-",
    name: "DEPLOYMENT.md",
    description: "Deployment and CI/CD",
    sections: ["setup", "ci-cd", "monitoring", "scaling"]
  },
  testing: {
    prefix: "07-",
    name: "TESTING.md",
    description: "Testing strategies and guidelines",
    sections: ["unit", "integration", "e2e", "coverage"]
  },
  monitoring: {
    prefix: "08-",
    name: "MONITORING.md",
    description: "Monitoring, logging, and observability",
    sections: ["logging", "metrics", "alerts", "tracing"]
  },
  security: {
    prefix: "09-",
    name: "SECURITY.md",
    description: "Security policies and compliance",
    sections: ["policies", "threats", "compliance", "auditing"]
  },
  compliance: {
    prefix: "10-",
    name: "COMPLIANCE.md",
    description: "Regulatory compliance and governance",
    sections: ["regulations", "audits", "documentation", "reporting"]
  },
  scaling: {
    prefix: "11-",
    name: "SCALING.md",
    description: "Scaling strategies and performance",
    sections: ["horizontal", "vertical", "caching", "optimization"]
  }
};

/**
 * Generate instruction files adaptively based on project analysis
 */
export async function generateAdaptiveFiles(
  steps: WorkflowStep[],
  context: UserContext,
  intent: string,
  target: InstructionTarget,
  userLines?: string[]
): Promise<ProjectOutput> {
  // Analyze project
  const lines = userLines || intent.split("\n").slice(0, 5);
  const analysis = analyzeProjectInput(lines, context);
  
  // Generate files based on analysis
  const files = analysis.needsMultipleFiles
    ? await generateMultipleFiles(steps, context, intent, target, analysis)
    : await generateSingleFile(steps, context, intent, target, analysis);
  
  // Calculate total quality
  const totalQuality = files.reduce((sum, f) => sum + f.quality.overallScore, 0) / files.length;
  
  return {
    analysis,
    files,
    isMultiFile: analysis.needsMultipleFiles,
    totalQuality: Math.round(totalQuality)
  };
}

/**
 * Generate a single comprehensive file
 */
async function generateSingleFile(
  steps: WorkflowStep[],
  context: UserContext,
  intent: string,
  target: InstructionTarget,
  _analysis: ProjectAnalysis
): Promise<GeneratedFile[]> {
  // Use existing assembler for single file
  const content = assembleInstruction(steps, context, intent, target);
  const quality = scoreInstruction(content, context);
  
  const fileName = getTargetFileName(target);
  
  return [{
    name: fileName,
    type: "comprehensive",
    content,
    quality,
    dependencies: []
  }];
}

/**
 * Generate multiple specialized files
 */
async function generateMultipleFiles(
  steps: WorkflowStep[],
  context: UserContext,
  intent: string,
  target: InstructionTarget,
  analysis: ProjectAnalysis
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  const fileTypes = analysis.domains.length > 0 
    ? mapDomainsToFileTypes(analysis.domains, analysis.fileCount)
    : ["comprehensive"];
  
  // Organize steps by domain
  const stepsByDomain = organizeStepsByDomain(steps, analysis.domains);
  
  // Generate each file
  for (let i = 0; i < fileTypes.length; i++) {
    const fileType = fileTypes[i];
    const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.comprehensive;
    
    // Get steps relevant to this file
    const relevantSteps = stepsByDomain.get(fileType) || steps;
    
    // Generate file content
    const content = generateFileContent(
      fileType,
      relevantSteps,
      context,
      intent,
      analysis,
      i === 0, // isFirst
      i === fileTypes.length - 1 // isLast
    );
    
    const quality = scoreInstruction(content, context);
    
    // Determine dependencies
    const dependencies = i > 0 
      ? files.slice(0, i).map(f => f.name)
      : [];
    
    files.push({
      name: `${config.prefix}${config.name}`,
      type: fileType,
      content,
      quality,
      dependencies
    });
  }
  
  return files;
}

/**
 * Map domains to file types
 */
function mapDomainsToFileTypes(domains: string[], maxFiles: number): string[] {
  const mapping: Record<string, string> = {
    frontend: "frontend",
    backend: "backend",
    database: "database",
    authentication: "authentication",
    deployment: "deployment",
    testing: "testing",
    monitoring: "monitoring",
    security: "security",
    compliance: "compliance",
    scaling: "scaling"
  };
  
  const fileTypes: string[] = [];
  
  // Add architecture for complex projects
  if (maxFiles >= 4) {
    fileTypes.push("architecture");
  }
  
  // Map domains to file types
  for (const domain of domains) {
    const fileType = mapping[domain];
    if (fileType && !fileTypes.includes(fileType)) {
      fileTypes.push(fileType);
    }
  }
  
  // Always add deployment for multi-file projects
  if (!fileTypes.includes("deployment") && maxFiles > 2) {
    fileTypes.push("deployment");
  }
  
  // Add specialized files for ultra-complex projects
  if (maxFiles >= 8) {
    if (!fileTypes.includes("monitoring")) fileTypes.push("monitoring");
    if (!fileTypes.includes("security")) fileTypes.push("security");
  }
  
  if (maxFiles >= 10) {
    if (!fileTypes.includes("compliance")) fileTypes.push("compliance");
    if (!fileTypes.includes("scaling")) fileTypes.push("scaling");
  }
  
  // Trim to max files
  return fileTypes.slice(0, maxFiles);
}

/**
 * Organize workflow steps by domain
 */
function organizeStepsByDomain(
  steps: WorkflowStep[],
  _domains: string[]
): Map<string, WorkflowStep[]> {
  const organized = new Map<string, WorkflowStep[]>();
  
  for (const step of steps) {
    const stepDomain = detectStepDomain(step);
    
    if (!organized.has(stepDomain)) {
      organized.set(stepDomain, []);
    }
    organized.get(stepDomain)!.push(step);
  }
  
  return organized;
}

/**
 * Detect which domain a step belongs to
 */
function detectStepDomain(step: WorkflowStep): string {
  const text = `${step.role} ${step.task} ${step.sectionName || ""}`.toLowerCase();
  
  // Check for domain keywords
  if (text.includes("frontend") || text.includes("component") || text.includes("ui") || text.includes("styling")) {
    return "frontend";
  }
  if (text.includes("backend") || text.includes("api") || text.includes("server") || text.includes("endpoint")) {
    return "backend";
  }
  if (text.includes("database") || text.includes("schema") || text.includes("model") || text.includes("data")) {
    return "database";
  }
  if (text.includes("auth") || text.includes("security") || text.includes("login") || text.includes("user management")) {
    return "authentication";
  }
  if (text.includes("deploy") || text.includes("docker") || text.includes("ci") || text.includes("production")) {
    return "deployment";
  }
  if (text.includes("test") || text.includes("spec") || text.includes("coverage")) {
    return "testing";
  }
  
  // Default to first domain or comprehensive
  return "comprehensive";
}

/**
 * Generate content for a specific file type
 */
function generateFileContent(
  fileType: string,
  steps: WorkflowStep[],
  context: UserContext,
  intent: string,
  analysis: ProjectAnalysis,
  isFirst: boolean,
  isLast: boolean
): string {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.comprehensive;
  
  // Build header
  let content = buildFileHeader(config, context, analysis, isFirst);
  
  // Add cross-file references for multi-file projects
  if (analysis.needsMultipleFiles && !isFirst) {
    content += buildCrossFileReferences(fileType, analysis);
  }
  
  // Add step outputs
  const completedSteps = steps.filter(s => s.status === "success" && s.output);
  content += buildStepOutputs(completedSteps, config.sections);
  
  // Add footer
  content += buildFileFooter(fileType, isLast);
  
  return content;
}

/**
 * Build file header
 */
function buildFileHeader(
  config: { name: string; description: string; sections: string[] },
  context: UserContext,
  analysis: ProjectAnalysis,
  isFirst: boolean
): string {
  const title = config.name.replace(".md", "").replace(/^\d+-/, "");
  
  let header = `# ${title} - AI Instruction File

> **Generated by IntentCompiler**
> **Project:** ${context.project || "Not specified"}
> **Type:** ${analysis.type}
> **Complexity:** ${analysis.complexity}
> **Generated:** ${new Date().toLocaleString()}

---

## Overview

${config.description}.

`;

  if (isFirst && analysis.needsMultipleFiles) {
    header += `> **Note:** This project uses multiple instruction files for better organization.
> Each file focuses on a specific aspect of the project.

---

`;
  }
  
  return header;
}

/**
 * Build cross-file references section
 */
function buildCrossFileReferences(fileType: string, analysis: ProjectAnalysis): string {
  const references: string[] = [];
  
  if (fileType !== "architecture" && analysis.domains.includes("frontend")) {
    references.push("Review the Architecture file for overall system design");
  }
  
  if (fileType === "backend" && analysis.domains.includes("database")) {
    references.push("Refer to Database file for schema and models");
  }
  
  if (fileType === "frontend" && analysis.domains.includes("backend")) {
    references.push("Check Backend file for API endpoints and data flow");
  }
  
  if (references.length === 0) {
    return "";
  }
  
  return `## Related Files

${references.map(r => `- ${r}`).join("\n")}

---

`;
}

/**
 * Build step outputs section
 */
function buildStepOutputs(
  steps: WorkflowStep[],
  _sections: string[]
): string {
  if (steps.length === 0) {
    return "## Content\n\n*No completed steps to include.*\n\n";
  }
  
  let content = "";
  
  for (const step of steps) {
    const sectionName = step.sectionName || step.role || "Content";
    const cleanedOutput = cleanOutput(step.output || "");
    
    content += `## ${sectionName}

${cleanedOutput}

---

`;
  }
  
  return content;
}

/**
 * Clean step output
 */
function cleanOutput(output: string): string {
  // Remove duplicate headers
  let cleaned = output.replace(/^##\s+(Role|Context|Rules|Overview|Responsibilities|Setup|Tools|Guidelines|Constraints)\s*\n/gim, "");
  
  // Remove workflow metadata
  cleaned = cleaned.replace(/^##\s+(Step History|Acceptance Tests|Quality)[\s\S]*?(?=\n##|$)/gi, "");
  cleaned = cleaned.replace(/\*No previous steps\.\*/gi, "");
  
  // Clean up newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  
  return cleaned.trim();
}

/**
 * Build file footer
 */
function buildFileFooter(fileType: string, isLast: boolean): string {
  let footer = "";
  
  if (isLast) {
    footer = `## Usage

These instruction files are designed to work together.
Follow them in sequence for best results.

### Integration Steps:
1. Review all files to understand the complete system
2. Start with Architecture file if present
3. Implement each domain following its specific file
4. Use Deployment file for production setup

---

*Generated with IntentCompiler - Transform your intent into structured AI instructions*
`;
  } else {
    footer = `---

*Generated with IntentCompiler*

`;
  }
  
  return footer;
}

/**
 * Get target file name
 */
function getTargetFileName(target: InstructionTarget): string {
  const names: Record<InstructionTarget, string> = {
    claude: "CLAUDE.md",
    agents: "AGENTS.md",
    gemini: "GEMINI.md",
    cursor: ".cursorrules",
    windsurf: ".windsurfrules",
    generic: "INSTRUCTIONS.md"
  };
  
  return names[target] || "CLAUDE.md";
}
