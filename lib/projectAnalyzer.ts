/**
 * Project Analyzer - Analyzes user input to determine project type, complexity,
 * and whether to generate single or multiple instruction files
 */

import type { UserContext } from "./types";

export type ProjectType = "website" | "webapp" | "fullstack" | "mobile" | "api" | "cli" | "documentation";
export type ComplexityLevel = "simple" | "medium" | "complex" | "ultra-complex";

export interface ProjectAnalysis {
  type: ProjectType;
  complexity: ComplexityLevel;
  needsMultipleFiles: boolean;
  fileCount: number;
  domains: string[];
  features: string[];
  techStack: string[];
  reasoning: string;
}

export interface FileDecision {
  shouldSplit: boolean;
  fileCount: number;
  fileTypes: string[];
  reasoning: string;
}

// Keywords for project type detection
const PROJECT_TYPE_KEYWORDS: Record<ProjectType, string[]> = {
  website: ["website", "landing page", "portfolio", "blog", "marketing", "static site", "informational"],
  webapp: ["web app", "dashboard", "admin panel", "portal", "management system", "crud", "application"],
  fullstack: ["full stack", "fullstack", "frontend and backend", "complete system", "end-to-end", "full system"],
  mobile: ["mobile app", "ios", "android", "react native", "flutter", "mobile application"],
  api: ["api", "rest api", "graphql", "backend service", "microservice", "endpoint"],
  cli: ["cli", "command line", "terminal", "console app", "script"],
  documentation: ["documentation", "docs", "wiki", "guide", "tutorial", "readme"]
};

// Keywords for complexity detection
const COMPLEXITY_KEYWORDS = {
  simple: ["simple", "basic", "minimal", "single page", "static", "landing", "portfolio", "blog"],
  medium: ["dashboard", "admin", "management", "crud", "authentication", "user accounts", "database", "api"],
  complex: ["microservice", "distributed", "real-time", "scalable", "enterprise", "multi-tenant", "payment", "integration", "ai", "machine learning"],
  "ultra-complex": ["multi-region", "global scale", "high availability", "disaster recovery", "compliance", "regulatory", "fintech", "healthcare", "aerospace", "defense", "critical infrastructure"]
};

// Domain keywords for file splitting decision
const DOMAIN_KEYWORDS = {
  frontend: ["ui", "interface", "components", "react", "vue", "angular", "css", "styling", "frontend"],
  backend: ["api", "server", "endpoints", "backend", "logic", "services", "node", "express"],
  database: ["database", "schema", "models", "mongodb", "postgres", "sql", "data layer"],
  authentication: ["auth", "login", "user management", "jwt", "session", "security"],
  deployment: ["deploy", "docker", "kubernetes", "ci/cd", "production", "hosting"],
  testing: ["test", "testing", "unit test", "integration test", "e2e"]
};

/**
 * Analyze project from user input (5 lines max)
 */
export function analyzeProjectInput(
  lines: string[],
  context?: UserContext
): ProjectAnalysis {
  const fullText = lines.join(" ").toLowerCase();
  
  // Detect project type
  const type = detectProjectType(fullText, context);
  
  // Detect complexity
  const complexity = detectComplexity(fullText, context);
  
  // Extract features and domains
  const features = extractFeatures(fullText);
  const domains = detectDomains(fullText);
  const techStack = extractTechStack(fullText, context);
  
  // Decide on file structure
  const fileDecision = decideFileStructure(type, complexity, domains, features);
  
  // Generate reasoning
  const reasoning = generateReasoning(type, complexity, fileDecision);
  
  return {
    type,
    complexity,
    needsMultipleFiles: fileDecision.shouldSplit,
    fileCount: fileDecision.fileCount,
    domains,
    features,
    techStack,
    reasoning
  };
}

/**
 * Detect project type from text
 */
function detectProjectType(text: string, context?: UserContext): ProjectType {
  // Check context tech stack first
  if (context?.techStack) {
    const techLower = context.techStack.toLowerCase();
    if (techLower.includes("react native") || techLower.includes("flutter")) return "mobile";
    if (techLower.includes("next") || techLower.includes("full")) return "fullstack";
  }
  
  // Score each project type
  const scores: Record<ProjectType, number> = {
    website: 0,
    webapp: 0,
    fullstack: 0,
    mobile: 0,
    api: 0,
    cli: 0,
    documentation: 0
  };
  
  for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[type as ProjectType] += 1;
      }
    }
  }
  
  // Find highest scoring type
  let maxScore = 0;
  let detectedType: ProjectType = "website"; // default
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as ProjectType;
    }
  }
  
  return detectedType;
}

/**
 * Detect complexity level
 */
function detectComplexity(text: string, context?: UserContext): ComplexityLevel {
  // Check context depth
  if (context?.depth === "detailed") {
    // Detailed depth suggests at least medium complexity
    if (text.includes("simple") || text.includes("basic")) {
      return "medium";
    }
  }
  
  // Score complexity
  let simpleScore = 0;
  let mediumScore = 0;
  let complexScore = 0;
  let ultraComplexScore = 0;
  
  for (const keyword of COMPLEXITY_KEYWORDS.simple) {
    if (text.includes(keyword)) simpleScore++;
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.medium) {
    if (text.includes(keyword)) mediumScore++;
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS.complex) {
    if (text.includes(keyword)) complexScore++;
  }
  
  for (const keyword of COMPLEXITY_KEYWORDS["ultra-complex"]) {
    if (text.includes(keyword)) ultraComplexScore++;
  }
  
  // Feature count affects complexity
  const featureCount = (text.match(/feature|include|have|with/gi) || []).length;
  if (featureCount > 10) ultraComplexScore += 3;
  else if (featureCount > 5) complexScore += 2;
  else if (featureCount > 2) mediumScore += 1;
  
  // Tech stack complexity
  const techStackCount = (text.match(/(react|vue|angular|node|django|mongodb|postgres|docker|kubernetes|aws|gcp|azure)/gi) || []).length;
  if (techStackCount > 8) ultraComplexScore += 2;
  else if (techStackCount > 5) complexScore += 1;
  
  // Determine complexity
  if (ultraComplexScore > 0 && ultraComplexScore > complexScore) return "ultra-complex";
  if (complexScore > mediumScore && complexScore > simpleScore) return "complex";
  if (mediumScore > simpleScore) return "medium";
  return "simple";
}

/**
 * Extract features from text
 */
function extractFeatures(text: string): string[] {
  const features: string[] = [];
  
  // Common feature patterns
  const featurePatterns = [
    /user\s+(authentication|login|signup|management)/gi,
    /real-?time\s+(updates|notifications|chat)/gi,
    /payment\s+(processing|integration)/gi,
    /(search|filter|sort)\s+(functionality|feature)/gi,
    /api\s+(integration|endpoints)/gi,
    /database\s+(integration|storage)/gi,
    /admin\s+(panel|dashboard)/gi,
    /notification\s+system/gi,
    /file\s+(upload|management)/gi,
    /analytics|reporting/gi
  ];
  
  for (const pattern of featurePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      features.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  return [...new Set(features)]; // Remove duplicates
}

/**
 * Detect domains present in project
 */
function detectDomains(text: string): string[] {
  const domains: string[] = [];
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        domains.push(domain);
        break;
      }
    }
  }
  
  return [...new Set(domains)];
}

/**
 * Extract tech stack
 */
function extractTechStack(text: string, context?: UserContext): string[] {
  const techStack: string[] = [];
  
  // From context
  if (context?.techStack) {
    techStack.push(...context.techStack.split(/[,\/\s]+/).filter(t => t.length > 2));
  }
  
  // From text
  const techPatterns = [
    /\b(react|vue|angular|svelte|next\.?js|nuxt|gatsby)\b/gi,
    /\b(node|express|django|flask|fastapi|rails|spring)\b/gi,
    /\b(mongodb|postgres|mysql|redis|firebase|supabase)\b/gi,
    /\b(typescript|javascript|python|java|go|rust)\b/gi,
    /\b(docker|kubernetes|aws|vercel|netlify|heroku)\b/gi
  ];
  
  for (const pattern of techPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      techStack.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  return [...new Set(techStack)];
}

/**
 * Decide whether to split into multiple files
 */
function decideFileStructure(
  type: ProjectType,
  complexity: ComplexityLevel,
  domains: string[],
  features: string[]
): FileDecision {
  // Simple projects: always single file
  if (complexity === "simple") {
    return {
      shouldSplit: false,
      fileCount: 1,
      fileTypes: ["comprehensive"],
      reasoning: "Simple project complexity - single comprehensive file is sufficient"
    };
  }
  
  // Medium complexity: check if domains are clearly separate
  if (complexity === "medium") {
    // If only 1-2 domains, single file is fine
    if (domains.length <= 2) {
      return {
        shouldSplit: false,
        fileCount: 1,
        fileTypes: ["comprehensive"],
        reasoning: "Medium complexity but cohesive domains - single file recommended"
      };
    }
    
    // 3+ distinct domains might benefit from splitting
    if (domains.length >= 3 && domains.includes("frontend") && domains.includes("backend")) {
      return {
        shouldSplit: true,
        fileCount: Math.min(3, domains.length),
        fileTypes: selectFileTypes(domains, 3),
        reasoning: "Medium complexity with distinct frontend/backend - splitting improves clarity"
      };
    }
    
    // Default to single file for medium
    return {
      shouldSplit: false,
      fileCount: 1,
      fileTypes: ["comprehensive"],
      reasoning: "Medium complexity - single file with clear sections"
    };
  }
  
  // Complex projects: usually benefit from multiple files
  if (complexity === "complex") {
    // Calculate optimal file count
    const fileCount = calculateOptimalFileCount(type, domains, features);
    
    // Even complex projects can be single file if cohesive
    if (fileCount === 1) {
      return {
        shouldSplit: false,
        fileCount: 1,
        fileTypes: ["comprehensive"],
        reasoning: "Complex but cohesive project - comprehensive single file"
      };
    }
    
    return {
      shouldSplit: true,
      fileCount,
      fileTypes: selectFileTypes(domains, fileCount),
      reasoning: `Complex project with ${domains.length} domains - splitting into ${fileCount} files for better organization`
    };
  }
  
  // Ultra-complex projects: always multiple files
  if (complexity === "ultra-complex") {
    const fileCount = calculateOptimalFileCount(type, domains, features, true);
    
    return {
      shouldSplit: true,
      fileCount: Math.max(fileCount, 8), // Minimum 8 files for ultra-complex
      fileTypes: selectFileTypes(domains, fileCount),
      reasoning: `Ultra-complex enterprise project requiring comprehensive documentation across ${fileCount} specialized files`
    };
  }
  
  // Default: single file
  return {
    shouldSplit: false,
    fileCount: 1,
    fileTypes: ["comprehensive"],
    reasoning: "Default to single comprehensive file"
  };
}

/**
 * Calculate optimal file count for complex projects
 */
function calculateOptimalFileCount(
  type: ProjectType,
  domains: string[],
  features: string[],
  isUltraComplex = false
): number {
  // Base count by project type
  const baseCount: Record<ProjectType, number> = {
    website: 1,
    webapp: 3,
    fullstack: 5,
    mobile: 3,
    api: 2,
    cli: 1,
    documentation: 1
  };
  
  let count = baseCount[type] || 1;
  
  // Adjust for domains
  if (domains.includes("frontend") && domains.includes("backend")) {
    count = Math.max(count, 2);
  }
  
  if (domains.includes("database")) {
    count = Math.max(count, 3);
  }
  
  if (domains.includes("authentication")) {
    count = Math.max(count, 3);
  }
  
  // Adjust for features
  if (features.length > 10) {
    count = Math.min(count + 2, 12); // Higher cap for feature-rich projects
  } else if (features.length > 5) {
    count = Math.min(count + 1, 8);
  }
  
  // Ultra-complex projects get more files
  if (isUltraComplex) {
    count = Math.max(count, 8);
    // Add specialized files for ultra-complex
    const specializedFiles = ["monitoring", "security", "compliance", "scaling"];
    for (const file of specializedFiles) {
      if (domains.some(d => file.includes(d))) {
        count++;
      }
    }
  }
  
  // Cap based on project type
  const maxFiles: Record<ProjectType, number> = {
    website: 3,
    webapp: 8,
    fullstack: 12,
    mobile: 6,
    api: 6,
    cli: 3,
    documentation: 4
  };
  
  return Math.min(count, maxFiles[type] || 8);
}

/**
 * Select file types based on domains and count
 */
function selectFileTypes(domains: string[], count: number): string[] {
  const priority: string[] = [];
  
  // Architecture is always first for complex projects
  if (count >= 4) {
    priority.push("architecture");
  }
  
  // Add domain-specific files
  if (domains.includes("frontend")) priority.push("frontend");
  if (domains.includes("backend")) priority.push("backend");
  if (domains.includes("database")) priority.push("database");
  if (domains.includes("authentication")) priority.push("authentication");
  if (domains.includes("deployment")) priority.push("deployment");
  if (domains.includes("testing")) priority.push("testing");
  
  // Fill remaining slots
  if (priority.length < count) {
    priority.push("deployment");
  }
  
  // Trim to exact count
  return priority.slice(0, count);
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(
  type: ProjectType,
  complexity: ComplexityLevel,
  fileDecision: FileDecision
): string {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const complexityLabel = complexity.charAt(0).toUpperCase() + complexity.slice(1);
  
  if (!fileDecision.shouldSplit) {
    return `${typeLabel} project with ${complexityLabel.toLowerCase()} complexity. ` +
           `A single comprehensive instruction file will provide clear, cohesive guidance for this project scope.`;
  }
  
  return `${typeLabel} project with ${complexityLabel.toLowerCase()} complexity. ` +
         `Splitting into ${fileDecision.fileCount} specialized files will improve clarity and maintainability. ` +
         `Files: ${fileDecision.fileTypes.join(", ")}.`;
}
