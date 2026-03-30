/**
 * Role matching algorithm for IntentCompiler
 * Analyzes project requirements and recommends optimal roles
 */

import { ROLE_DATABASE, type RoleDefinition } from "./roleDatabase";
import type { UserContext, RoleRecommendation } from "./types";

export interface ProjectAnalysis {
  complexity: "simple" | "medium" | "complex";
  domain: string[];
  requiredSkills: string[];
  teamSize: number;
  timeline: string;
  riskLevel: "low" | "medium" | "high";
}

export function analyzeProject(context: UserContext): ProjectAnalysis {
  const { project, constraints, techStack } = context;
  
  // Analyze complexity based on project description and constraints
  const complexityScore = calculateComplexityScore(project, constraints, techStack);
  const complexity = complexityScore <= 3 ? "simple" : complexityScore <= 7 ? "medium" : "complex";
  
  // Extract domain keywords
  const domain = extractDomains(project, techStack);
  
  // Identify required skills
  const requiredSkills = extractRequiredSkills(project, techStack, constraints);
  
  // Estimate team size based on complexity and domain
  const teamSize = estimateTeamSize(complexity, domain);
  
  // Assess risk level
  const riskLevel = assessRiskLevel(project, constraints, techStack);
  
  return {
    complexity,
    domain,
    requiredSkills,
    teamSize,
    timeline: "standard", // Could be enhanced with user input
    riskLevel
  };
}

function calculateComplexityScore(project: string, constraints: string[], techStack?: string): number {
  let score = 0;
  
  // Project description analysis
  const complexKeywords = [
    "enterprise", "scalable", "distributed", "microservices", "real-time",
    "machine learning", "artificial intelligence", "blockchain", "integration",
    "multi-tenant", "high-availability", "performance critical", "security"
  ];
  
  const simpleKeywords = [
    "simple", "basic", "prototype", "mockup", "proof of concept", "minimum viable product",
    "landing page", "portfolio", "blog", "documentation"
  ];
  
  const projectLower = project.toLowerCase();
  
  // Check for complexity indicators
  complexKeywords.forEach(keyword => {
    if (projectLower.includes(keyword)) score += 2;
  });
  
  simpleKeywords.forEach(keyword => {
    if (projectLower.includes(keyword)) score -= 1;
  });
  
  // Constraints analysis
  constraints.forEach(constraint => {
    if (constraint.toLowerCase().includes("security") || 
        constraint.toLowerCase().includes("compliance") ||
        constraint.toLowerCase().includes("scalability")) {
      score += 1;
    }
  });
  
  // Tech stack analysis
  if (techStack) {
    const complexTech = ["kubernetes", "microservices", "distributed systems", "machine learning", "blockchain"];
    const techLower = techStack.toLowerCase();
    
    complexTech.forEach(tech => {
      if (techLower.includes(tech)) score += 2;
    });
  }
  
  return Math.max(1, Math.min(10, score + 5)); // Normalize to 1-10
}

function extractDomains(project: string, techStack?: string): string[] {
  const domains = [];
  const text = (project + " " + (techStack || "")).toLowerCase();
  
  const domainKeywords = {
    "web": ["web", "website", "frontend", "backend", "full-stack", "react", "vue", "angular"],
    "mobile": ["mobile", "ios", "android", "react-native", "flutter"],
    "enterprise": ["enterprise", "business", "corporate", "b2b"],
    "ecommerce": ["ecommerce", "e-commerce", "shopping", "cart", "payment"],
    "data": ["data", "analytics", "dashboard", "reporting", "database"],
    "ai/ml": ["artificial intelligence", "machine learning", "ai", "ml", "neural"],
    "security": ["security", "authentication", "authorization", "encryption"],
    "devops": ["devops", "deployment", "infrastructure", "cloud", "aws", "azure"],
    "api": ["api", "rest", "graphql", "microservices", "integration"]
  };
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      domains.push(domain);
    }
  }
  
  return domains.length > 0 ? domains : ["general"];
}

function extractRequiredSkills(project: string, techStack?: string, constraints: string[] = []): string[] {
  const skills = new Set<string>();
  const text = [project, techStack || "", ...constraints].join(" ").toLowerCase();
  
  const skillKeywords = {
    "programming": ["javascript", "typescript", "python", "java", "c#", "go", "rust"],
    "frontend": ["react", "vue", "angular", "html", "css", "sass", "tailwind"],
    "backend": ["node.js", "express", "django", "flask", "spring", "api"],
    "database": ["sql", "nosql", "mongodb", "postgresql", "mysql", "redis"],
    "cloud": ["aws", "azure", "gcp", "cloud", "serverless"],
    "devops": ["docker", "kubernetes", "ci/cd", "deployment", "infrastructure"],
    "security": ["security", "authentication", "oauth", "jwt", "encryption"],
    "testing": ["testing", "unit test", "integration test", "e2e", "cypress"],
    "design": ["ui", "ux", "design", "figma", "prototype"],
    "data": ["data", "analytics", "machine learning", "ai", "statistics"]
  };
  
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      skills.add(skill);
    }
  }
  
  return Array.from(skills);
}

function estimateTeamSize(complexity: "simple" | "medium" | "complex", domains: string[]): number {
  const baseSize = {
    simple: 2,
    medium: 4,
    complex: 7
  };
  
  const domainMultiplier = domains.length > 3 ? 1.5 : domains.length > 1 ? 1.2 : 1;
  
  return Math.round(baseSize[complexity] * domainMultiplier);
}

function assessRiskLevel(project: string, constraints: string[], techStack?: string): "low" | "medium" | "high" {
  let riskScore = 0;
  
  const highRiskKeywords = ["critical", "security", "compliance", "regulation", "high-availability", "mission-critical"];
  const mediumRiskKeywords = ["performance", "scalability", "integration", "migration"];
  
  const text = [project, ...constraints, techStack || ""].join(" ").toLowerCase();
  
  highRiskKeywords.forEach(keyword => {
    if (text.includes(keyword)) riskScore += 2;
  });
  
  mediumRiskKeywords.forEach(keyword => {
    if (text.includes(keyword)) riskScore += 1;
  });
  
  if (riskScore >= 3) return "high";
  if (riskScore >= 1) return "medium";
  return "low";
}

export function recommendRoles(analysis: ProjectAnalysis, userTier: "free" | "premium" = "free"): RoleRecommendation[] {
  const recommendations: RoleRecommendation[] = [];
  const availableRoles = userTier === "premium" ? 
    Object.values(ROLE_DATABASE) : 
    Object.values(ROLE_DATABASE).filter(role => !role.isPremium);
  
  // Core roles based on complexity
  const coreRoles = getCoreRoles(analysis.complexity, analysis.domain);
  
  // Add specialized roles based on domain and skills
  const specializedRoles = getSpecializedRoles(analysis.domain, analysis.requiredSkills);
  
  // Combine and score roles
  const allCandidateRoles = [...coreRoles, ...specializedRoles];
  
  for (const roleId of allCandidateRoles) {
    const availableRole = availableRoles.find(r => r.id === roleId);
    if (!availableRole) continue;
    
    const score = calculateRoleScore(availableRole, analysis);
    if (score > 0.3) { // Only include relevant roles
      recommendations.push({
        role: availableRole.id,
        confidence: score,
        reasoning: generateReasoning(availableRole, analysis),
        category: availableRole.category,
        expertiseLevel: availableRole.expertiseLevel
      });
    }
  }
  
  // Sort by confidence and limit team size
  return recommendations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, analysis.teamSize);
}

function getCoreRoles(complexity: "simple" | "medium" | "complex", domains: string[]): string[] {
  const coreRoles = ["senior_developer", "mid_developer"]; // Always need developers
  
  if (complexity === "simple") {
    coreRoles.push("junior_developer");
  }
  
  if (complexity === "medium" || complexity === "complex") {
    coreRoles.push("product_manager", "qa_engineer");
  }
  
  if (complexity === "complex") {
    coreRoles.push("software_architect", "tech_project_manager", "engineering_manager");
  }
  
  // Add domain-specific core roles
  if (domains.includes("web") || domains.includes("mobile")) {
    coreRoles.push("ux_designer");
  }
  
  if (domains.includes("data")) {
    coreRoles.push("data_scientist");
  }
  
  if (domains.includes("devops")) {
    coreRoles.push("devops_engineer");
  }
  
  return coreRoles;
}

function getSpecializedRoles(domains: string[], requiredSkills: string[]): string[] {
  const specializedRoles: string[] = [];
  
  // Domain-based specializations
  if (domains.includes("web")) {
    specializedRoles.push("frontend_developer", "backend_developer", "full_stack_developer");
  }
  
  if (domains.includes("mobile")) {
    specializedRoles.push("frontend_developer"); // Mobile dev often uses similar skills
  }
  
  if (domains.includes("enterprise")) {
    specializedRoles.push("solutions_architect", "system_architect");
  }
  
  if (domains.includes("ai/ml")) {
    specializedRoles.push("ai_engineer");
  }
  
  if (domains.includes("security")) {
    specializedRoles.push("security_engineer");
  }
  
  // Skill-based specializations
  if (requiredSkills.includes("security")) {
    specializedRoles.push("security_engineer");
  }
  
  if (requiredSkills.includes("devops")) {
    specializedRoles.push("platform_engineer", "automation_engineer");
  }
  
  if (requiredSkills.includes("data")) {
    specializedRoles.push("database_architect");
  }
  
  return specializedRoles;
}

function calculateRoleScore(role: RoleDefinition, analysis: ProjectAnalysis): number {
  let score = 0;
  
  // Base score for role relevance
  score += role.complexityScore <= (analysis.complexity === "simple" ? 4 : analysis.complexity === "medium" ? 7 : 10) ? 0.5 : 0;
  
  // Domain matching
  const domainMatch = role.typicalProjects.some(project => 
    analysis.domain.some(domain => project.toLowerCase().includes(domain))
  );
  if (domainMatch) score += 0.3;
  
  // Skill matching
  const skillMatch = analysis.requiredSkills.some(skill => 
    role.skills.some(roleSkill => roleSkill.toLowerCase().includes(skill))
  );
  if (skillMatch) score += 0.2;
  
  // Risk level consideration
  if (analysis.riskLevel === "high" && role.expertiseLevel === "principal") score += 0.2;
  if (analysis.riskLevel === "high" && role.expertiseLevel === "senior") score += 0.1;
  
  // Complexity alignment
  if (analysis.complexity === "complex" && role.expertiseLevel === "senior") score += 0.1;
  if (analysis.complexity === "complex" && role.expertiseLevel === "principal") score += 0.2;
  if (analysis.complexity === "simple" && role.expertiseLevel === "junior") score += 0.1;
  
  return Math.min(1, score);
}

function generateReasoning(role: RoleDefinition, analysis: ProjectAnalysis): string {
  const reasons = [];
  
  // Complexity reasoning
  if (analysis.complexity === "complex" && role.expertiseLevel === "principal") {
    reasons.push("High complexity project requires principal-level expertise");
  } else if (analysis.complexity === "complex" && role.expertiseLevel === "senior") {
    reasons.push("Complex project benefits from senior-level experience");
  } else if (analysis.complexity === "simple" && role.expertiseLevel === "junior") {
    reasons.push("Simple project suitable for junior-level contribution");
  }
  
  // Domain reasoning
  const domainMatch = role.typicalProjects.find(project => 
    analysis.domain.some(domain => project.toLowerCase().includes(domain))
  );
  if (domainMatch) {
    reasons.push(`Relevant experience with ${domainMatch}`);
  }
  
  // Skill reasoning
  const skillMatch = role.skills.find(skill => 
    analysis.requiredSkills.some(reqSkill => skill.toLowerCase().includes(reqSkill))
  );
  if (skillMatch) {
    reasons.push(`Required ${skillMatch} skills`);
  }
  
  // Risk reasoning
  if (analysis.riskLevel === "high" && role.category === "specialized") {
    reasons.push("High-risk project requires specialized expertise");
  }
  
  return reasons.join("; ") || "General role fit for project requirements";
}

export function getWorkflowConfig(analysis: ProjectAnalysis, userTier: "free" | "premium"): {
  maxSteps: number;
  allowCustomSteps: boolean;
  allowRoleEditing: boolean;
  enableValidation: boolean;
} {
  const baseConfig = {
    simple: { maxSteps: 4, allowCustomSteps: false, allowRoleEditing: true, enableValidation: true },
    medium: { maxSteps: 6, allowCustomSteps: userTier === "premium", allowRoleEditing: true, enableValidation: true },
    complex: { maxSteps: 8, allowCustomSteps: userTier === "premium", allowRoleEditing: true, enableValidation: true }
  };
  
  const config = baseConfig[analysis.complexity];
  
  // Premium tier gets unlimited steps
  if (userTier === "premium") {
    return { ...config, maxSteps: 999 };
  }
  
  return config;
}
