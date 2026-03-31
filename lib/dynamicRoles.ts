// Dynamic Roles System
// Creates custom agents based on user intent and domain detection

import { AgentType, UserContext } from './schemas';
import { getLogger } from './logger';

const logger = getLogger('dynamic-roles');

// ============================================
// DOMAIN DEFINITIONS
// ============================================

interface DomainTemplate {
  name: string;
  keywords: string[];
  requiredAgents: AgentDefinition[];
  defaultTechStack: string[];
  commonConstraints: string[];
}

interface AgentDefinition {
  type: AgentType;
  name: string;
  expertise: string[];
  capabilities: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
}

// ============================================
// DOMAIN TEMPLATES
// ============================================

const DOMAIN_TEMPLATES: Record<string, DomainTemplate> = {
  // Food & Recipe Domain
  food: {
    name: 'Food & Recipe',
    keywords: ['recipe', 'food', 'cooking', 'meal', 'ingredient', 'kitchen', 'dish', 'nutrition', 'restaurant', 'menu'],
    requiredAgents: [
      {
        type: 'architect' as AgentType,
        name: 'RecipeArchitect',
        expertise: ['culinary', 'recipe_design', 'ingredient_analysis'],
        capabilities: ['analyze_ingredients', 'suggest_substitutions', 'estimate_cooking_time', 'dietary_restrictions'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'CookingInstructor',
        expertise: ['cooking_techniques', 'step_by_step_instructions'],
        capabilities: ['recipe_instructions', 'cooking_tips', 'preparation_steps', 'serving_suggestions'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'Nutritionist',
        expertise: ['nutrition', 'dietary_analysis', 'health'],
        capabilities: ['nutritional_analysis', 'calorie_counting', 'dietary_recommendations', 'allergy_warnings'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'UIDesigner',
        expertise: ['ui_design', 'recipe_app_interface'],
        capabilities: ['recipe_ui_design', 'ingredient_search_interface', 'meal_planning_ui'],
        priority: 'medium'
      },
      {
        type: 'documenter' as AgentType,
        name: 'RecipeWriter',
        expertise: ['content_writing', 'recipe_documentation'],
        capabilities: ['recipe_descriptions', 'cooking_tips', 'serving_suggestions', 'storage_instructions'],
        priority: 'medium'
      }
    ],
    defaultTechStack: ['React', 'Node.js', 'MongoDB', 'Express'],
    commonConstraints: ['Must handle dietary restrictions', 'Include nutritional information', 'Mobile-friendly interface']
  },

  // Finance Domain
  finance: {
    name: 'Finance & Analytics',
    keywords: ['finance', 'financial', 'money', 'investment', 'trading', 'budget', 'accounting', 'dashboard', 'analytics'],
    requiredAgents: [
      {
        type: 'architect' as AgentType,
        name: 'FinancialArchitect',
        expertise: ['financial_systems', 'data_modeling', 'compliance'],
        capabilities: ['financial_data_modeling', 'compliance_requirements', 'security_design'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'DataAnalyst',
        expertise: ['data_analysis', 'financial_metrics', 'reporting'],
        capabilities: ['financial_analysis', 'kpi_definition', 'trend_analysis', 'risk_assessment'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'ChartExpert',
        expertise: ['data_visualization', 'chart_design', 'dashboard'],
        capabilities: ['chart_selection', 'visualization_design', 'dashboard_layout', 'interactive_charts'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'SecurityExpert',
        expertise: ['security', 'encryption', 'compliance'],
        capabilities: ['security_design', 'encryption_requirements', 'audit_trails', 'access_control'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'APIArchitect',
        expertise: ['api_design', 'data_endpoints', 'integration'],
        capabilities: ['api_design', 'data_endpoints', 'third_party_integration', 'rate_limiting'],
        priority: 'medium'
      }
    ],
    defaultTechStack: ['React', 'Python', 'PostgreSQL', 'D3.js', 'FastAPI'],
    commonConstraints: ['Must comply with financial regulations', 'Secure data handling', 'Real-time updates']
  },

  // Social Media Domain
  social: {
    name: 'Social Media & Community',
    keywords: ['social', 'community', 'network', 'chat', 'messaging', 'posts', 'users', 'friends', 'content'],
    requiredAgents: [
      {
        type: 'architect' as AgentType,
        name: 'SocialArchitect',
        expertise: ['social_systems', 'user_interaction', 'community_design'],
        capabilities: ['user_flow_design', 'social_features', 'community_guidelines', 'engagement_metrics'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'UXDesigner',
        expertise: ['ux_design', 'social_interfaces', 'user_experience'],
        capabilities: ['social_ui_design', 'interaction_patterns', 'onboarding_flow', 'engagement_features'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'BackendArchitect',
        expertise: ['backend_systems', 'scalability', 'real_time'],
        capabilities: ['scalable_architecture', 'real_time_messaging', 'user_management', 'content_delivery'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'DatabaseDesigner',
        expertise: ['database_design', 'social_data', 'relationships'],
        capabilities: ['social_data_modeling', 'relationship_design', 'content_storage', 'query_optimization'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'ContentModerator',
        expertise: ['content_moderation', 'safety', 'community_guidelines'],
        capabilities: ['moderation_systems', 'content_filtering', 'abuse_detection', 'safety_features'],
        priority: 'high'
      }
    ],
    defaultTechStack: ['React', 'Node.js', 'PostgreSQL', 'Socket.io', 'Redis'],
    commonConstraints: ['Must handle real-time messaging', 'Content moderation required', 'Scalable to millions of users']
  },

  // Education Domain
  education: {
    name: 'Education & Learning',
    keywords: ['education', 'learning', 'course', 'teaching', 'student', 'lesson', 'curriculum', 'quiz', 'exam'],
    requiredAgents: [
      {
        type: 'architect' as AgentType,
        name: 'EducationArchitect',
        expertise: ['educational_systems', 'learning_design', 'curriculum'],
        capabilities: ['learning_path_design', 'curriculum_structure', 'assessment_framework', 'progress_tracking'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'CurriculumDesigner',
        expertise: ['curriculum_design', 'educational_content', 'learning_objectives'],
        capabilities: ['lesson_planning', 'content_organization', 'learning_objectives', 'assessment_design'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'ContentExpert',
        expertise: ['content_creation', 'educational_materials', 'subject_matter'],
        capabilities: ['content_creation', 'material_organization', 'knowledge_structuring', 'examples_creation'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'AssessmentDesigner',
        expertise: ['assessment', 'testing', 'evaluation'],
        capabilities: ['quiz_design', 'exam_creation', 'grading_systems', 'feedback_mechanisms'],
        priority: 'medium'
      },
      {
        type: 'instructor' as AgentType,
        name: 'StudentExperience',
        expertise: ['student_experience', 'engagement', 'motivation'],
        capabilities: ['engagement_features', 'gamification', 'progress_visualization', 'motivation_systems'],
        priority: 'medium'
      }
    ],
    defaultTechStack: ['React', 'Node.js', 'MongoDB', 'WebRTC', 'Canvas API'],
    commonConstraints: ['Must support multimedia content', 'Accessible design required', 'Mobile-friendly learning']
  },

  // E-commerce Domain
  ecommerce: {
    name: 'E-commerce & Shopping',
    keywords: ['shop', 'store', 'product', 'cart', 'checkout', 'payment', 'inventory', 'shipping', 'ecommerce'],
    requiredAgents: [
      {
        type: 'architect' as AgentType,
        name: 'CommerceArchitect',
        expertise: ['ecommerce_systems', 'payment_processing', 'inventory'],
        capabilities: ['ecommerce_flow', 'payment_integration', 'inventory_management', 'order_processing'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'ProductManager',
        expertise: ['product_management', 'catalog_design', 'merchandising'],
        capabilities: ['product_catalog', 'search_functionality', 'filtering_system', 'recommendation_engine'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'PaymentExpert',
        expertise: ['payment_systems', 'security', 'compliance'],
        capabilities: ['payment_gateway', 'security_measures', 'fraud_detection', 'compliance_requirements'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'UXDesigner',
        expertise: ['ecommerce_ux', 'conversion_optimization', 'user_journey'],
        capabilities: ['shopping_experience', 'checkout_optimization', 'product_display', 'user_flow'],
        priority: 'high'
      },
      {
        type: 'instructor' as AgentType,
        name: 'InventoryManager',
        expertise: ['inventory_management', 'logistics', 'supply_chain'],
        capabilities: ['inventory_tracking', 'stock_management', 'shipping_integration', 'order_fulfillment'],
        priority: 'medium'
      }
    ],
    defaultTechStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Redis'],
    commonConstraints: ['Must handle payments securely', 'Inventory management required', 'Mobile shopping experience']
  },

  // General/Fallback Domain
  general: {
    name: 'General Purpose',
    keywords: [],
    requiredAgents: [
      {
        type: 'architect' as AgentType,
        name: 'SystemArchitect',
        expertise: ['system_design', 'architecture', 'planning'],
        capabilities: ['system_design', 'architecture_planning', 'technology_selection', 'scalability_planning'],
        priority: 'critical'
      },
      {
        type: 'instructor' as AgentType,
        name: 'Developer',
        expertise: ['development', 'coding', 'implementation'],
        capabilities: ['development_instructions', 'coding_guidelines', 'best_practices', 'implementation_steps'],
        priority: 'high'
      },
      {
        type: 'validator' as AgentType,
        name: 'QualityAssurance',
        expertise: ['testing', 'validation', 'quality'],
        capabilities: ['quality_checks', 'validation_rules', 'testing_strategies', 'quality_metrics'],
        priority: 'high'
      },
      {
        type: 'reviewer' as AgentType,
        name: 'SystemReviewer',
        expertise: ['system_review', 'optimization', 'best_practices'],
        capabilities: ['system_review', 'optimization_suggestions', 'best_practices', 'performance_analysis'],
        priority: 'medium'
      },
      {
        type: 'documenter' as AgentType,
        name: 'TechnicalWriter',
        expertise: ['documentation', 'writing', 'communication'],
        capabilities: ['technical_documentation', 'user_guides', 'api_docs', 'readme_creation'],
        priority: 'medium'
      }
    ],
    defaultTechStack: ['React', 'Node.js', 'TypeScript', 'Next.js'],
    commonConstraints: ['Follow best practices', 'Ensure scalability', 'Maintain code quality']
  }
};

// ============================================
// DOMAIN DETECTION
// ============================================

export class DomainDetector {
  /**
   * Detect domain from user intent
   */
  detectDomain(intent: string): { domain: string; confidence: number; template: DomainTemplate } {
    const intentLower = intent.toLowerCase();
    let bestMatch = { domain: 'general', confidence: 0, template: DOMAIN_TEMPLATES.general };

    for (const [domainKey, template] of Object.entries(DOMAIN_TEMPLATES)) {
      if (domainKey === 'general') continue;

      const matches = template.keywords.filter(keyword => 
        intentLower.includes(keyword.toLowerCase())
      );

      const confidence = matches.length / template.keywords.length;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          domain: domainKey,
          confidence,
          template
        };
      }
    }

    logger.info(`Domain detected: ${bestMatch.domain} (${(bestMatch.confidence * 100).toFixed(1)}% confidence)`, {
      intent,
      detectedDomain: bestMatch.domain,
      confidence: bestMatch.confidence,
      keywords: bestMatch.template.keywords
    }, 'DomainDetector');

    return bestMatch;
  }

  /**
   * Get all available domains
   */
  getAvailableDomains(): Array<{ key: string; name: string; keywords: string[] }> {
    return Object.entries(DOMAIN_TEMPLATES)
      .filter(([key]) => key !== 'general')
      .map(([key, template]) => ({
        key,
        name: template.name,
        keywords: template.keywords
      }));
  }
}

// ============================================
// DYNAMIC AGENT FACTORY
// ============================================

export class DynamicAgentFactory {
  private domainDetector: DomainDetector;

  constructor() {
    this.domainDetector = new DomainDetector();
  }

  /**
   * Create dynamic agents based on intent
   */
  createDynamicAgents(
    intent: string,
    userContext: UserContext
  ): {
    domain: string;
    agents: AgentDefinition[];
    techStack: string[];
    constraints: string[];
    confidence: number;
  } {
    const { domain, confidence, template } = this.domainDetector.detectDomain(intent);

    // Enhance agents with user context
    const enhancedAgents = this.enhanceAgents(template.requiredAgents, userContext);

    // Determine tech stack
    const techStack = userContext.techStack 
      ? userContext.techStack.split(',').map(t => t.trim())
      : template.defaultTechStack;

    // Combine constraints
    const constraints = [
      ...template.commonConstraints,
      ...(userContext.constraints || [])
    ];

    logger.info(`Created ${enhancedAgents.length} dynamic agents for ${domain} domain`, {
      domain,
      confidence,
      agentCount: enhancedAgents.length,
      techStack,
      constraints: constraints.length
    }, 'DynamicAgentFactory');

    return {
      domain,
      agents: enhancedAgents,
      techStack,
      constraints,
      confidence
    };
  }

  /**
   * Enhance agents with user context
   */
  private enhanceAgents(
    agents: AgentDefinition[],
    userContext: UserContext
  ): AgentDefinition[] {
    return agents.map(agent => ({
      ...agent,
      // Add user-specific capabilities based on context
      capabilities: [
        ...agent.capabilities,
        ...this.getContextualCapabilities(agent, userContext)
      ]
    }));
  }

  /**
   * Get contextual capabilities based on user context
   */
  private getContextualCapabilities(
    agent: AgentDefinition,
    userContext: UserContext
  ): string[] {
    const capabilities: string[] = [];

    // Audience-specific capabilities
    if (userContext.audience) {
      if (userContext.audience.includes('beginner')) {
        capabilities.push('beginner_friendly_instructions', 'step_by_step_guidance');
      }
      if (userContext.audience.includes('developer')) {
        capabilities.push('technical_details', 'code_examples', 'api_documentation');
      }
      if (userContext.audience.includes('business')) {
        capabilities.push('business_value', 'roi_analysis', 'cost_benefits');
      }
    }

    // Tech stack-specific capabilities
    if (userContext.techStack) {
      const techStack = userContext.techStack.toLowerCase();
      if (techStack.includes('react')) {
        capabilities.push('react_patterns', 'component_design', 'state_management');
      }
      if (techStack.includes('node')) {
        capabilities.push('nodejs_patterns', 'api_design', 'server_side_logic');
      }
      if (techStack.includes('python')) {
        capabilities.push('python_patterns', 'data_processing', 'ml_integration');
      }
    }

    // Style-specific capabilities
    if (userContext.style) {
      if (userContext.style.includes('minimal')) {
        capabilities.push('minimalist_design', 'clean_architecture');
      }
      if (userContext.style.includes('comprehensive')) {
        capabilities.push('detailed_documentation', 'extensive_testing', 'full_coverage');
      }
    }

    return capabilities;
  }

  /**
   * Get domain template by key
   */
  getDomainTemplate(domain: string): DomainTemplate | null {
    return DOMAIN_TEMPLATES[domain] || null;
  }
}

// ============================================
// DYNAMIC AGENT IMPLEMENTATIONS
// ============================================

export class DynamicAgent {
  public readonly type: AgentType;
  public readonly name: string;
  public readonly expertise: string[];
  public readonly capabilities: string[];
  public readonly priority: string;
  public readonly domain: string;

  constructor(
    definition: AgentDefinition,
    domain: string
  ) {
    this.type = definition.type;
    this.name = definition.name;
    this.expertise = definition.expertise;
    this.capabilities = definition.capabilities;
    this.priority = definition.priority;
    this.domain = domain;
  }

  async execute(task: any, context: any): Promise<any> {
    logger.info(`[${this.name}] Executing task: ${task.task}`, {
      agentType: this.type,
      domain: this.domain,
      expertise: this.expertise,
      capabilities: this.capabilities
    }, 'DynamicAgent');

    // Simulate agent execution based on domain and capabilities
    const startTime = Date.now();
    
    try {
      const result = await this.generateOutput(task, context);
      
      const executionTime = Date.now() - startTime;
      
      logger.info(`[${this.name}] Task completed successfully`, {
        executionTime,
        confidence: result.confidence
      }, 'DynamicAgent');
      
      return {
        taskId: task.id,
        success: true,
        output: result,
        confidence: result.confidence,
        executionTimeMs: executionTime,
        warnings: result.warnings || []
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error(`[${this.name}] Task failed`, {
        error: (error as Error).message,
        executionTime
      }, 'DynamicAgent');
      
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: executionTime,
        warnings: [(error as Error).message]
      };
    }
  }

  private async generateOutput(task: any, context: any): Promise<any> {
    // Domain-specific output generation
    switch (this.domain) {
      case 'food':
        return this.generateFoodOutput(task, context);
      case 'finance':
        return this.generateFinanceOutput(task, context);
      case 'social':
        return this.generateSocialOutput(task, context);
      case 'education':
        return this.generateEducationOutput(task, context);
      case 'ecommerce':
        return this.generateEcommerceOutput(task, context);
      default:
        return this.generateGeneralOutput(task, context);
    }
  }

  private async generateFoodOutput(task: any, context: any): Promise<any> {
    // Food domain specific logic
    if (this.name === 'RecipeArchitect') {
      return {
        phases: ['ingredient_analysis', 'recipe_planning', 'cooking_instructions', 'presentation'],
        recipeStructure: {
          ingredients: [],
          steps: [],
          nutrition: {},
          dietary: []
        },
        confidence: 0.95
      };
    }
    
    if (this.name === 'Nutritionist') {
      return {
        nutritionalAnalysis: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          vitamins: []
        },
        dietaryRecommendations: [],
        confidence: 0.92
      };
    }
    
    return { confidence: 0.85 };
  }

  private async generateFinanceOutput(task: any, context: any): Promise<any> {
    // Finance domain specific logic
    if (this.name === 'DataAnalyst') {
      return {
        financialMetrics: ['revenue', 'profit', 'expenses', 'roi'],
        analysisMethods: ['trend_analysis', 'variance_analysis', 'correlation'],
        confidence: 0.93
      };
    }
    
    if (this.name === 'ChartExpert') {
      return {
        chartTypes: ['line', 'bar', 'pie', 'scatter', 'heatmap'],
        visualizationStrategy: 'interactive_dashboard',
        confidence: 0.90
      };
    }
    
    return { confidence: 0.85 };
  }

  private async generateSocialOutput(task: any, context: any): Promise<any> {
    // Social domain specific logic
    if (this.name === 'UXDesigner') {
      return {
        socialFeatures: ['posts', 'comments', 'likes', 'shares', 'profiles'],
        designPatterns: ['infinite_scroll', 'real_time_updates', 'gamification'],
        confidence: 0.91
      };
    }
    
    return { confidence: 0.85 };
  }

  private async generateEducationOutput(task: any, context: any): Promise<any> {
    // Education domain specific logic
    if (this.name === 'CurriculumDesigner') {
      return {
        curriculumStructure: ['modules', 'lessons', 'assessments', 'projects'],
        learningObjectives: [],
        confidence: 0.94
      };
    }
    
    return { confidence: 0.85 };
  }

  private async generateEcommerceOutput(task: any, context: any): Promise<any> {
    // E-commerce domain specific logic
    if (this.name === 'ProductManager') {
      return {
        productFeatures: ['search', 'filters', 'recommendations', 'reviews'],
        catalogStructure: ['categories', 'attributes', 'variants', 'inventory'],
        confidence: 0.92
      };
    }
    
    return { confidence: 0.85 };
  }

  private async generateGeneralOutput(task: any, context: any): Promise<any> {
    // General purpose logic
    return {
      systemComponents: ['frontend', 'backend', 'database', 'api'],
      architectureStyle: 'modern_scalable',
      confidence: 0.88
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export const domainDetector = new DomainDetector();
export const dynamicAgentFactory = new DynamicAgentFactory();

export default {
  DomainDetector,
  DynamicAgentFactory,
  DynamicAgent,
  DOMAIN_TEMPLATES
};
