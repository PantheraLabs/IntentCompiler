/**
 * Comprehensive role database for IntentCompiler
 * Categorizes roles by expertise level, domain, and complexity
 */

export type RoleCategory = 
  | "leadership"
  | "architecture" 
  | "development"
  | "quality"
  | "design"
  | "emerging"
  | "specialized";

export type ExpertiseLevel = "junior" | "mid" | "senior" | "principal" | "fellow";

export interface RoleDefinition {
  id: string;
  name: string;
  category: RoleCategory;
  expertiseLevel: ExpertiseLevel;
  description: string;
  responsibilities: string[];
  skills: string[];
  typicalProjects: string[];
  complexityScore: number; // 1-10
  isPremium?: boolean;
  dependencies?: string[]; // Other roles this typically works with
}

export const ROLE_DATABASE: Record<string, RoleDefinition> = {
  // Leadership Roles
  "product_manager": {
    id: "product_manager",
    name: "Product Manager",
    category: "leadership",
    expertiseLevel: "senior",
    description: "Strategic leader responsible for product vision, roadmap, and cross-team coordination",
    responsibilities: [
      "Define product strategy and vision",
      "Manage product backlog and priorities",
      "Coordinate between development, design, and business teams",
      "Analyze market trends and user needs",
      "Set and track product KPIs"
    ],
    skills: ["Strategic thinking", "Communication", "Data analysis", "Stakeholder management"],
    typicalProjects: ["Web applications", "Mobile apps", "Enterprise software", "SaaS platforms"],
    complexityScore: 8,
    dependencies: ["tech_lead", "ux_designer", "business_analyst"]
  },
  
  "tech_project_manager": {
    id: "tech_project_manager",
    name: "Tech Project Manager",
    category: "leadership", 
    expertiseLevel: "senior",
    description: "Technical project manager bridging development teams and business objectives",
    responsibilities: [
      "Convert product roadmap to technical schedule",
      "Manage sprint planning and velocity tracking",
      "Identify and mitigate technical risks",
      "Coordinate DevOps and deployment processes",
      "Ensure cross-team dependency management"
    ],
    skills: ["Technical knowledge", "Risk management", "Agile methodologies", "Team coordination"],
    typicalProjects: ["Enterprise software", "System integrations", "Cloud migrations"],
    complexityScore: 7,
    dependencies: ["engineering_manager", "devops_engineer"]
  },

  "engineering_manager": {
    id: "engineering_manager",
    name: "Engineering Manager",
    category: "leadership",
    expertiseLevel: "senior", 
    description: "People leader managing engineering teams and technical culture",
    responsibilities: [
      "Lead and mentor engineering teams",
      "Drive technical excellence and culture",
      "Manage hiring and team growth",
      "Balance technical debt with feature delivery",
      "Collaborate with product and business stakeholders"
    ],
    skills: ["People management", "Technical leadership", "Strategic planning", "Performance coaching"],
    typicalProjects: ["Large-scale applications", "Platform development", "Team scaling"],
    complexityScore: 8,
    dependencies: ["tech_lead", "senior_developer"]
  },

  // Architecture Roles
  "software_architect": {
    id: "software_architect",
    name: "Software Architect",
    category: "architecture",
    expertiseLevel: "principal",
    description: "Technical leader designing system architecture and technical strategy",
    responsibilities: [
      "Design system architecture and patterns",
      "Make technology stack decisions",
      "Define coding standards and best practices",
      "Review technical designs and implementations",
      "Plan for scalability and performance"
    ],
    skills: ["System design", "Technology evaluation", "Performance optimization", "Technical leadership"],
    typicalProjects: ["Enterprise systems", "Microservices", "Cloud platforms", "API design"],
    complexityScore: 9,
    isPremium: true,
    dependencies: ["tech_lead", "senior_developer"]
  },

  "solutions_architect": {
    id: "solutions_architect",
    name: "Solutions Architect",
    category: "architecture",
    expertiseLevel: "principal",
    description: "Architecture specialist focused on solving complex business problems with technology",
    responsibilities: [
      "Design end-to-end solutions",
      "Integrate multiple systems and technologies",
      "Ensure security and compliance requirements",
      "Optimize for cost and performance",
      "Create technical documentation and diagrams"
    ],
    skills: ["Integration design", "Security knowledge", "Cost optimization", "Stakeholder communication"],
    typicalProjects: ["System integrations", "Cloud migrations", "Enterprise solutions"],
    complexityScore: 9,
    isPremium: true
  },

  "system_architect": {
    id: "system_architect",
    name: "System Architect",
    category: "architecture",
    expertiseLevel: "principal",
    description: "High-level architect focusing on large-scale system design and infrastructure",
    responsibilities: [
      "Design large-scale system architecture",
      "Plan infrastructure and deployment strategies",
      "Define system boundaries and interfaces",
      "Ensure reliability and scalability",
      "Guide technology evolution"
    ],
    skills: ["Distributed systems", "Infrastructure design", "Scalability planning", "Risk assessment"],
    typicalProjects: ["Distributed systems", "Cloud platforms", "High-traffic applications"],
    complexityScore: 10,
    isPremium: true
  },

  // Development Roles
  "senior_developer": {
    id: "senior_developer",
    name: "Senior Developer",
    category: "development",
    expertiseLevel: "senior",
    description: "Experienced developer handling complex features and mentoring others",
    responsibilities: [
      "Develop complex features and components",
      "Code review and quality assurance",
      "Mentor junior developers",
      "Technical problem-solving and debugging",
      "Contribute to architectural decisions"
    ],
    skills: ["Programming expertise", "Problem-solving", "Code review", "Mentoring"],
    typicalProjects: ["Web applications", "Mobile apps", "API development", "Database design"],
    complexityScore: 7,
    dependencies: ["mid_developer"]
  },

  "full_stack_developer": {
    id: "full_stack_developer",
    name: "Full-Stack Developer",
    category: "development",
    expertiseLevel: "mid",
    description: "Versatile developer working across frontend and backend technologies",
    responsibilities: [
      "Develop both frontend and backend features",
      "Design and implement APIs",
      "Database design and management",
      "UI/UX implementation",
      "Deployment and DevOps tasks"
    ],
    skills: ["Frontend development", "Backend development", "Database management", "DevOps basics"],
    typicalProjects: ["Web applications", "SaaS platforms", "E-commerce sites"],
    complexityScore: 6
  },

  "frontend_developer": {
    id: "frontend_developer",
    name: "Frontend Developer",
    category: "development",
    expertiseLevel: "mid",
    description: "Specialist in user interface development and user experience implementation",
    responsibilities: [
      "Implement responsive user interfaces",
      "Optimize application performance",
      "Ensure cross-browser compatibility",
      "Collaborate with designers on UX implementation",
      "Manage frontend build processes"
    ],
    skills: ["JavaScript/TypeScript", "CSS/Styling", "React/Vue/Angular", "Performance optimization"],
    typicalProjects: ["Web applications", "Mobile web apps", "Interactive dashboards"],
    complexityScore: 5
  },

  "backend_developer": {
    id: "backend_developer",
    name: "Backend Developer",
    category: "development",
    expertiseLevel: "mid",
    description: "Server-side specialist focusing on APIs, databases, and business logic",
    responsibilities: [
      "Design and implement REST APIs",
      "Database design and optimization",
      "Business logic implementation",
      "Security and authentication",
      "Performance monitoring and optimization"
    ],
    skills: ["Server-side programming", "Database management", "API design", "Security"],
    typicalProjects: ["API services", "Microservices", "Data processing systems"],
    complexityScore: 6
  },

  "mid_developer": {
    id: "mid_developer",
    name: "Mid-Level Developer",
    category: "development",
    expertiseLevel: "mid",
    description: "Competent developer handling standard features with some autonomy",
    responsibilities: [
      "Implement features based on specifications",
      "Participate in code reviews",
      "Debug and fix issues",
      "Write unit tests",
      "Collaborate with team members"
    ],
    skills: ["Programming", "Testing", "Debugging", "Teamwork"],
    typicalProjects: ["Feature development", "Bug fixes", "Maintenance tasks"],
    complexityScore: 4
  },

  "junior_developer": {
    id: "junior_developer",
    name: "Junior Developer",
    category: "development",
    expertiseLevel: "junior",
    description: "Entry-level developer learning and growing with guidance",
    responsibilities: [
      "Implement simple features",
      "Fix bugs and issues",
      "Write and maintain tests",
      "Learn codebase and best practices",
      "Participate in code reviews"
    ],
    skills: ["Basic programming", "Learning attitude", "Attention to detail", "Collaboration"],
    typicalProjects: ["Simple features", "Bug fixes", "Documentation"],
    complexityScore: 2
  },

  // Quality Roles
  "qa_engineer": {
    id: "qa_engineer",
    name: "QA Engineer",
    category: "quality",
    expertiseLevel: "mid",
    description: "Quality assurance specialist ensuring software reliability and user satisfaction",
    responsibilities: [
      "Design and execute test plans",
      "Manual testing and exploratory testing",
      "Bug reporting and tracking",
      "Collaborate with developers on quality issues",
      "User acceptance testing"
    ],
    skills: ["Testing methodologies", "Bug tracking", "Attention to detail", "User empathy"],
    typicalProjects: ["Web applications", "Mobile apps", "API testing"],
    complexityScore: 5
  },

  "test_architect": {
    id: "test_architect",
    name: "Test Architect",
    category: "quality",
    expertiseLevel: "senior",
    description: "Senior quality professional designing comprehensive testing strategies",
    responsibilities: [
      "Design test automation frameworks",
      "Define quality standards and metrics",
      "Plan testing strategies for complex systems",
      "Mentor QA team members",
      "Ensure compliance with quality standards"
    ],
    skills: ["Test automation", "Quality strategy", "Framework design", "Leadership"],
    typicalProjects: ["Enterprise testing", "Automation frameworks", "Quality systems"],
    complexityScore: 8,
    isPremium: true
  },

  "automation_engineer": {
    id: "automation_engineer",
    name: "Automation Engineer",
    category: "quality",
    expertiseLevel: "senior",
    description: "Specialist in test automation and CI/CD pipeline quality",
    responsibilities: [
      "Develop automated test scripts",
      "Integrate testing into CI/CD pipelines",
      "Performance and load testing",
      "Monitor test coverage and quality metrics",
      "Maintain test infrastructure"
    ],
    skills: ["Test automation", "CI/CD", "Performance testing", "Programming"],
    typicalProjects: ["Automated testing", "CI/CD integration", "Performance testing"],
    complexityScore: 7,
    isPremium: true
  },

  // Design Roles
  "ux_designer": {
    id: "ux_designer",
    name: "UX Designer",
    category: "design",
    expertiseLevel: "mid",
    description: "User experience specialist focusing on user research and interaction design",
    responsibilities: [
      "Conduct user research and analysis",
      "Create user personas and journey maps",
      "Design wireframes and prototypes",
      "Usability testing and iteration",
      "Collaborate with UI designers and developers"
    ],
    skills: ["User research", "Wireframing", "Prototyping", "Usability testing"],
    typicalProjects: ["Web applications", "Mobile apps", "User research studies"],
    complexityScore: 6
  },

  "ui_designer": {
    id: "ui_designer",
    name: "UI Designer",
    category: "design",
    expertiseLevel: "mid",
    description: "Visual design specialist creating beautiful and functional interfaces",
    responsibilities: [
      "Create visual designs and mockups",
      "Design systems and component libraries",
      "Ensure brand consistency",
      "Collaborate with developers on implementation",
      "Design responsive layouts"
    ],
    skills: ["Visual design", "Design systems", "Prototyping tools", "Brand guidelines"],
    typicalProjects: ["Web applications", "Mobile apps", "Design systems"],
    complexityScore: 5
  },

  "product_designer": {
    id: "product_designer",
    name: "Product Designer",
    category: "design",
    expertiseLevel: "senior",
    description: "Full-stack designer handling both UX and UI with product thinking",
    responsibilities: [
      "End-to-end design process",
      "User research and analysis",
      "Visual design and prototyping",
      "Design system management",
      "Product strategy collaboration"
    ],
    skills: ["UX/UI design", "Product thinking", "Research", "Systems thinking"],
    typicalProjects: ["Product design", "Design systems", "User research"],
    complexityScore: 7,
    isPremium: true
  },

  // Emerging Roles
  "ai_engineer": {
    id: "ai_engineer",
    name: "AI Engineer",
    category: "emerging",
    expertiseLevel: "senior",
    description: "Specialist in implementing AI/ML solutions and intelligent systems",
    responsibilities: [
      "Implement machine learning models",
      "Design AI-powered features",
      "Optimize model performance",
      "Ensure AI ethics and safety",
      "Integrate AI with existing systems"
    ],
    skills: ["Machine learning", "Python", "Data processing", "AI ethics"],
    typicalProjects: ["AI features", "ML models", "Intelligent systems"],
    complexityScore: 9,
    isPremium: true
  },

  "devops_engineer": {
    id: "devops_engineer",
    name: "DevOps Engineer",
    category: "emerging",
    expertiseLevel: "senior",
    description: "Infrastructure and deployment specialist enabling rapid, reliable software delivery",
    responsibilities: [
      "Design CI/CD pipelines",
      "Manage cloud infrastructure",
      "Monitor system performance and reliability",
      "Automate deployment processes",
      "Ensure security and compliance"
    ],
    skills: ["Cloud platforms", "CI/CD", "Infrastructure as code", "Monitoring"],
    typicalProjects: ["Cloud infrastructure", "CI/CD pipelines", "Monitoring systems"],
    complexityScore: 8,
    isPremium: true
  },

  "platform_engineer": {
    id: "platform_engineer",
    name: "Platform Engineer",
    category: "emerging",
    expertiseLevel: "senior",
    description: "Internal platform builder providing developer tools and infrastructure",
    responsibilities: [
      "Build internal developer platforms",
      "Create developer tooling and abstractions",
      "Manage shared infrastructure",
      "Enable self-service capabilities",
      "Improve developer experience"
    ],
    skills: ["Platform architecture", "Developer experience", "Infrastructure", "Automation"],
    typicalProjects: ["Developer platforms", "Internal tools", "Infrastructure"],
    complexityScore: 9,
    isPremium: true
  },

  "data_scientist": {
    id: "data_scientist",
    name: "Data Scientist",
    category: "emerging",
    expertiseLevel: "senior",
    description: "Analytics specialist extracting insights from data and building predictive models",
    responsibilities: [
      "Analyze complex datasets",
      "Build predictive models",
      "Create data visualizations",
      "Design experiments and A/B tests",
      "Communicate insights to stakeholders"
    ],
    skills: ["Data analysis", "Statistics", "Machine learning", "Visualization"],
    typicalProjects: ["Data analysis", "Predictive models", "Analytics dashboards"],
    complexityScore: 8,
    isPremium: true
  },

  // Specialized Roles
  "security_engineer": {
    id: "security_engineer",
    name: "Security Engineer",
    category: "specialized",
    expertiseLevel: "senior",
    description: "Security specialist ensuring application and infrastructure security",
    responsibilities: [
      "Conduct security assessments",
      "Implement security controls",
      "Monitor for security threats",
      "Ensure compliance with security standards",
      "Educate team on security best practices"
    ],
    skills: ["Security assessment", "Cryptography", "Compliance", "Threat modeling"],
    typicalProjects: ["Security systems", "Compliance", "Security audits"],
    complexityScore: 8,
    isPremium: true
  },

  "performance_engineer": {
    id: "performance_engineer",
    name: "Performance Engineer",
    category: "specialized",
    expertiseLevel: "senior",
    description: "Performance optimization specialist ensuring speed and scalability",
    responsibilities: [
      "Conduct performance testing",
      "Optimize application performance",
      "Monitor system performance",
      "Design for scalability",
      "Troubleshoot performance issues"
    ],
    skills: ["Performance testing", "Optimization", "Monitoring", "Scalability"],
    typicalProjects: ["Performance optimization", "Load testing", "Scalability"],
    complexityScore: 8,
    isPremium: true
  },

  "database_architect": {
    id: "database_architect",
    name: "Database Architect",
    category: "specialized",
    expertiseLevel: "principal",
    description: "Database specialist designing data architecture and optimization strategies",
    responsibilities: [
      "Design database architecture",
      "Optimize database performance",
      "Plan data migration strategies",
      "Ensure data security and compliance",
      "Design data governance policies"
    ],
    skills: ["Database design", "Performance optimization", "Data modeling", "Security"],
    typicalProjects: ["Database architecture", "Data migration", "Performance optimization"],
    complexityScore: 9,
    isPremium: true
  }
};

export const ROLE_CATEGORIES: Record<RoleCategory, { name: string; description: string }> = {
  leadership: {
    name: "Leadership",
    description: "Strategic roles managing teams, products, and technical direction"
  },
  architecture: {
    name: "Architecture", 
    description: "Technical roles designing system architecture and making technology decisions"
  },
  development: {
    name: "Development",
    description: "Programming roles building and implementing software features"
  },
  quality: {
    name: "Quality",
    description: "Testing and quality assurance roles ensuring software reliability"
  },
  design: {
    name: "Design",
    description: "User experience and interface design roles creating user-centered products"
  },
  emerging: {
    name: "Emerging",
    description: "Modern roles in AI, DevOps, and data science"
  },
  specialized: {
    name: "Specialized",
    description: "Expert roles in security, performance, and specific technical domains"
  }
};

export function getRolesByCategory(category: RoleCategory): RoleDefinition[] {
  return Object.values(ROLE_DATABASE).filter(role => role.category === category);
}

export function getRolesByExpertise(level: ExpertiseLevel): RoleDefinition[] {
  return Object.values(ROLE_DATABASE).filter(role => role.expertiseLevel === level);
}

export function getPremiumRoles(): RoleDefinition[] {
  return Object.values(ROLE_DATABASE).filter(role => role.isPremium);
}

export function getFreeRoles(): RoleDefinition[] {
  return Object.values(ROLE_DATABASE).filter(role => !role.isPremium);
}

export function searchRoles(query: string): RoleDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(ROLE_DATABASE).filter(role => 
    role.name.toLowerCase().includes(lowercaseQuery) ||
    role.description.toLowerCase().includes(lowercaseQuery) ||
    role.skills.some(skill => skill.toLowerCase().includes(lowercaseQuery)) ||
    role.typicalProjects.some(project => project.toLowerCase().includes(lowercaseQuery))
  );
}
