// Multi-Agent Orchestration System
// Supervisor coordinates specialized agents for workflow generation

import {
  AgentType,
  AgentTask,
  OrchestrationPlan,
  WorkflowStep,
  Workflow,
  UserContext,
  IntentSpec,
  validateWithSchema,
  AgentTaskSchema,
  OrchestrationPlanSchema
} from './schemas';
import { StepAction } from './actionSchemas';
import { dynamicAgentFactory, DynamicAgent } from './dynamicRoles';

// ============================================
// SPECIALIZED AGENTS
// ============================================

/**
 * Base Agent Interface
 */
interface Agent {
  type: AgentType;
  execute(task: AgentTask, context: UserContext): Promise<AgentTaskResult>;
  canHandle(task: AgentTask): boolean;
}

/**
 * Agent Task Result
 */
interface AgentTaskResult {
  taskId: string;
  success: boolean;
  output: any;
  confidence: number;
  executionTimeMs: number;
  warnings: string[];
  metadata?: Record<string, any>;
}

/**
 * Architect Agent - Workflow architecture and design
 */
class ArchitectAgent implements Agent {
  type: AgentType = 'architect';

  canHandle(task: AgentTask): boolean {
    return task.agentType === 'architect' || 
           task.task.toLowerCase().includes('architecture') ||
           task.task.toLowerCase().includes('design');
  }

  async execute(task: AgentTask, context: UserContext): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      // Architect designs the workflow structure
      const architecture = await this.designWorkflowArchitecture(task, context);
      
      return {
        taskId: task.id,
        success: true,
        output: architecture,
        confidence: 0.95,
        executionTimeMs: Date.now() - startTime,
        warnings: []
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        warnings: [(error as Error).message]
      };
    }
  }

  private async designWorkflowArchitecture(task: AgentTask, context: UserContext): Promise<any> {
    // Design workflow structure based on task and context
    return {
      phases: ['specify', 'plan', 'tasks', 'execute'],
      parallelizable: this.canParallelize(task),
      estimatedSteps: this.estimateStepCount(context),
      recommendedAgents: this.recommendAgents(task)
    };
  }

  private canParallelize(task: AgentTask): boolean {
    // Determine if workflow steps can run in parallel
    return !task.dependencies || task.dependencies.length === 0;
  }

  private estimateStepCount(context: UserContext): number {
    // Estimate number of steps based on context complexity
    const baseSteps = 3;
    const techStackMultiplier = context.techStack ? context.techStack.split(',').length * 0.5 : 0;
    const constraintsMultiplier = context.constraints.length * 0.3;
    
    return Math.ceil(baseSteps + techStackMultiplier + constraintsMultiplier);
  }

  private recommendAgents(task: AgentTask): AgentType[] {
    // Recommend which agents should work on this workflow
    const agents: AgentType[] = ['instructor', 'validator'];
    
    if (task.task.includes('document')) {
      agents.push('documenter');
    }
    
    if (task.task.includes('review') || task.task.includes('quality')) {
      agents.push('reviewer');
    }
    
    return agents;
  }
}

/**
 * Instructor Agent - Instruction generation and refinement
 */
class InstructorAgent implements Agent {
  type: AgentType = 'instructor';

  canHandle(task: AgentTask): boolean {
    return task.agentType === 'instructor' ||
           task.task.toLowerCase().includes('instruction') ||
           task.task.toLowerCase().includes('generate');
  }

  async execute(task: AgentTask, context: UserContext): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      const instructions = await this.generateInstructions(task, context);
      
      return {
        taskId: task.id,
        success: true,
        output: instructions,
        confidence: 0.92,
        executionTimeMs: Date.now() - startTime,
        warnings: this.validateInstructions(instructions)
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        warnings: [(error as Error).message]
      };
    }
  }

  private async generateInstructions(task: AgentTask, context: UserContext): Promise<string> {
    // Generate detailed instructions for the workflow step
    const template = this.selectTemplate(task, context);
    return this.fillTemplate(template, task, context);
  }

  private selectTemplate(task: AgentTask, context: UserContext): string {
    // Select appropriate instruction template
    if (task.task.includes('role')) {
      return 'role_instruction_template';
    } else if (task.task.includes('context')) {
      return 'context_instruction_template';
    }
    return 'general_instruction_template';
  }

  private fillTemplate(template: string, task: AgentTask, context: UserContext): string {
    // Fill template with context-specific information
    return `Generated instruction for: ${task.task}\nContext: ${JSON.stringify(context, null, 2)}`;
  }

  private validateInstructions(instructions: string): string[] {
    const warnings: string[] = [];
    
    if (instructions.length < 50) {
      warnings.push('Instructions are quite brief');
    }
    
    if (!instructions.includes('##')) {
      warnings.push('Instructions lack proper structure (missing headers)');
    }
    
    return warnings;
  }
}

/**
 * Validator Agent - Quality assurance and validation
 */
class ValidatorAgent implements Agent {
  type: AgentType = 'validator';

  canHandle(task: AgentTask): boolean {
    return task.agentType === 'validator' ||
           task.task.toLowerCase().includes('validate') ||
           task.task.toLowerCase().includes('quality');
  }

  async execute(task: AgentTask, context: UserContext): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      const validationResult = await this.validateOutput(task, context);
      
      return {
        taskId: task.id,
        success: validationResult.valid,
        output: validationResult,
        confidence: validationResult.confidence,
        executionTimeMs: Date.now() - startTime,
        warnings: validationResult.issues
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        warnings: [(error as Error).message]
      };
    }
  }

  private async validateOutput(task: AgentTask, context: UserContext): Promise<any> {
    // Validate the output from previous agents
    const issues: string[] = [];
    let confidence = 1.0;

    // Check if output exists
    if (!task.context?.output) {
      issues.push('No output to validate');
      confidence = 0;
    }

    // Check output quality
    const output = task.context?.output as string;
    if (output && output.length < 100) {
      issues.push('Output seems incomplete');
      confidence -= 0.2;
    }

    return {
      valid: issues.length === 0,
      issues,
      confidence: Math.max(confidence, 0),
      suggestions: this.generateSuggestions(issues)
    };
  }

  private generateSuggestions(issues: string[]): string[] {
    return issues.map(issue => {
      if (issue.includes('incomplete')) {
        return 'Add more detail to the output';
      }
      if (issue.includes('No output')) {
        return 'Ensure previous step generates output';
      }
      return 'Review and improve quality';
    });
  }
}

/**
 * Reviewer Agent - Workflow review and optimization
 */
class ReviewerAgent implements Agent {
  type: AgentType = 'reviewer';

  canHandle(task: AgentTask): boolean {
    return task.agentType === 'reviewer' ||
           task.task.toLowerCase().includes('review') ||
           task.task.toLowerCase().includes('optimize');
  }

  async execute(task: AgentTask, context: UserContext): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      const review = await this.reviewWorkflow(task, context);
      
      return {
        taskId: task.id,
        success: true,
        output: review,
        confidence: 0.88,
        executionTimeMs: Date.now() - startTime,
        warnings: review.criticalIssues
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        warnings: [(error as Error).message]
      };
    }
  }

  private async reviewWorkflow(task: AgentTask, context: UserContext): Promise<any> {
    return {
      overallQuality: 0.85,
      criticalIssues: [],
      suggestions: [
        'Consider adding error handling',
        'Add validation checkpoints'
      ],
      optimizations: [
        'Steps 2 and 3 can run in parallel',
        'Reduce redundant validations'
      ]
    };
  }
}

/**
 * Documenter Agent - Documentation generation
 */
class DocumenterAgent implements Agent {
  type: AgentType = 'documenter';

  canHandle(task: AgentTask): boolean {
    return task.agentType === 'documenter' ||
           task.task.toLowerCase().includes('document') ||
           task.task.toLowerCase().includes('readme');
  }

  async execute(task: AgentTask, context: UserContext): Promise<AgentTaskResult> {
    const startTime = Date.now();
    
    try {
      const documentation = await this.generateDocumentation(task, context);
      
      return {
        taskId: task.id,
        success: true,
        output: documentation,
        confidence: 0.90,
        executionTimeMs: Date.now() - startTime,
        warnings: []
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        warnings: [(error as Error).message]
      };
    }
  }

  private async generateDocumentation(task: AgentTask, context: UserContext): Promise<string> {
    return `# ${context.project || 'Project'} Documentation

## Overview
${task.task}

## Tech Stack
${context.techStack || 'Not specified'}

## Getting Started
1. Clone the repository
2. Install dependencies
3. Run the application

## Contributing
Please read CONTRIBUTING.md for details.
`;
  }
}

// ============================================
// SUPERVISOR AGENT
// ============================================

/**
 * Supervisor Agent - Orchestrates and delegates to specialized agents
 */
class SupervisorAgent {
  private agents: Map<string, Agent> = new Map();
  private dynamicAgents: Map<string, DynamicAgent> = new Map();
  private useDynamicRoles: boolean = true;

  constructor() {
    // Register fallback agents
    this.agents.set('architect', new ArchitectAgent());
    this.agents.set('instructor', new InstructorAgent());
    this.agents.set('validator', new ValidatorAgent());
    this.agents.set('reviewer', new ReviewerAgent());
    this.agents.set('documenter', new DocumenterAgent());
  }

  /**
   * Enable or disable dynamic roles
   */
  setDynamicRoles(enabled: boolean): void {
    this.useDynamicRoles = enabled;
  }

  /**
   * Create dynamic orchestration plan based on intent
   */
  async createDynamicPlan(
    workflow: Workflow,
    context: UserContext
  ): Promise<OrchestrationPlan> {
    // Create dynamic agents based on intent
    const dynamicConfig = dynamicAgentFactory.createDynamicAgents(workflow.intent, context);
    
    // Clear previous dynamic agents
    this.dynamicAgents.clear();
    
    // Create and register dynamic agents
    const tasks: AgentTask[] = [];
    
    for (const agentDef of dynamicConfig.agents) {
      const dynamicAgent = new DynamicAgent(agentDef, dynamicConfig.domain);
      this.dynamicAgents.set(agentDef.name, dynamicAgent);
      
      // Create task for this agent
      const task: AgentTask = {
        id: crypto.randomUUID(),
        agentType: agentDef.type,
        task: this.getAgentTask(agentDef, workflow, context),
        context: { 
          workflow, 
          userContext: context,
          agentDefinition: agentDef,
          domain: dynamicConfig.domain
        },
        dependencies: this.getTaskDependencies(agentDef, tasks),
        priority: agentDef.priority as 'high' | 'medium' | 'low',
        status: 'pending'
      };
      
      tasks.push(task);
    }

    const plan: OrchestrationPlan = {
      id: crypto.randomUUID(),
      workflowId: workflow.id,
      tasks,
      parallelizable: this.canParallelize(tasks),
      estimatedDuration: this.estimateDuration(tasks),
      strategy: this.selectStrategy(tasks)
    };

    // Validate plan
    const validation = validateWithSchema(OrchestrationPlanSchema, plan);
    if (!validation.success) {
      throw new Error(`Invalid orchestration plan: ${validation.errors}`);
    }

    return plan;
  }

  /**
   * Get appropriate task for agent based on its definition
   */
  private getAgentTask(agentDef: any, workflow: Workflow, context: UserContext): string {
    const domainTasks: Record<string, Record<string, string>> = {
      food: {
        RecipeArchitect: 'Design recipe structure and ingredient analysis',
        CookingInstructor: 'Generate step-by-step cooking instructions',
        Nutritionist: 'Analyze nutritional content and dietary information',
        UIDesigner: 'Design recipe app interface and user experience',
        RecipeWriter: 'Create recipe descriptions and cooking tips'
      },
      finance: {
        FinancialArchitect: 'Design financial system architecture and compliance',
        DataAnalyst: 'Analyze financial data and create metrics',
        ChartExpert: 'Design financial visualizations and dashboards',
        SecurityExpert: 'Implement security measures and compliance',
        APIArchitect: 'Create financial data APIs and endpoints'
      },
      social: {
        SocialArchitect: 'Design social platform architecture and user flows',
        UXDesigner: 'Design social media interface and interactions',
        BackendArchitect: 'Create scalable backend for social features',
        DatabaseDesigner: 'Design social data models and relationships',
        ContentModerator: 'Implement content moderation and safety features'
      },
      education: {
        EducationArchitect: 'Design learning platform architecture',
        CurriculumDesigner: 'Create curriculum structure and learning paths',
        ContentExpert: 'Generate educational content and materials',
        AssessmentDesigner: 'Create quizzes and assessment systems',
        StudentExperience: 'Design student engagement and motivation features'
      },
      ecommerce: {
        CommerceArchitect: 'Design e-commerce system architecture',
        ProductManager: 'Create product catalog and management system',
        PaymentExpert: 'Implement payment processing and security',
        UXDesigner: 'Design shopping experience and checkout flow',
        InventoryManager: 'Create inventory and order management system'
      }
    };

    const domain = dynamicAgentFactory.getDomainTemplate('food') ? 'food' : 'general';
    
    if (domainTasks[domain] && domainTasks[domain][agentDef.name]) {
      return domainTasks[domain][agentDef.name];
    }

    // Fallback to generic task
    return `${agentDef.expertise.join(' & ')}: ${agentDef.capabilities.slice(0, 2).join(', ')}`;
  }

  /**
   * Get task dependencies based on agent definition
   */
  private getTaskDependencies(agentDef: any, existingTasks: AgentTask[]): string[] {
    const dependencies: string[] = [];
    
    // Architect agents always run first (no dependencies)
    if (agentDef.type === 'architect') {
      return [];
    }
    
    // Find architect task as dependency
    const architectTask = existingTasks.find(t => t.agentType === 'architect');
    if (architectTask) {
      dependencies.push(architectTask.id);
    }
    
    // Add other dependencies based on agent definition
    if (agentDef.dependencies) {
      for (const depName of agentDef.dependencies) {
        const depTask = existingTasks.find(t => t.task.includes(depName));
        if (depTask) {
          dependencies.push(depTask.id);
        }
      }
    }
    
    return dependencies;
  }

  /**
   * Create orchestration plan for workflow
   */
  async createPlan(
    workflow: Workflow,
    context: UserContext
  ): Promise<OrchestrationPlan> {
    const tasks: AgentTask[] = [];

    // Use dynamic roles if enabled
    if (this.useDynamicRoles) {
      return this.createDynamicPlan(workflow, context);
    }

    // Fallback to fixed roles
    // Task 1: Architecture design
    tasks.push({
      id: crypto.randomUUID(),
      agentType: 'architect',
      task: 'Design workflow architecture',
      context: { workflow, userContext: context },
      dependencies: [],
      priority: 'high',
      status: 'pending'
    });

    // Task 2: Generate instructions for each step
    workflow.steps?.forEach((step, index) => {
      tasks.push({
        id: crypto.randomUUID(),
        agentType: 'instructor',
        task: `Generate instructions for step: ${step.description}`,
        context: { step, userContext: context },
        dependencies: [tasks[0].id], // Depends on architecture
        priority: 'medium',
        status: 'pending'
      });
    });

    // Task 3: Validate all outputs
    tasks.push({
      id: crypto.randomUUID(),
      agentType: 'validator',
      task: 'Validate all workflow outputs',
      context: { workflow, userContext: context },
      dependencies: tasks.slice(1).map(t => t.id), // Depends on all instruction tasks
      priority: 'high',
      status: 'pending'
    });

    // Task 4: Review and optimize
    tasks.push({
      id: crypto.randomUUID(),
      agentType: 'reviewer',
      task: 'Review and optimize workflow',
      context: { workflow, userContext: context },
      dependencies: [tasks[tasks.length - 1].id], // Depends on validation
      priority: 'medium',
      status: 'pending'
    });

    const plan: OrchestrationPlan = {
      id: crypto.randomUUID(),
      workflowId: workflow.id,
      tasks,
      parallelizable: this.canParallelize(tasks),
      estimatedDuration: this.estimateDuration(tasks),
      strategy: this.selectStrategy(tasks)
    };

    // Validate plan
    const validation = validateWithSchema(OrchestrationPlanSchema, plan);
    if (!validation.success) {
      throw new Error(`Invalid orchestration plan: ${validation.errors}`);
    }

    return plan;
  }

  /**
   * Execute orchestration plan
   */
  async executePlan(
    plan: OrchestrationPlan,
    context: UserContext
  ): Promise<Map<string, AgentTaskResult>> {
    const results = new Map<string, AgentTaskResult>();
    const completedTasks = new Set<string>();

    // Execute based on strategy
    if (plan.strategy === 'sequential') {
      await this.executeSequential(plan.tasks, context, results, completedTasks);
    } else if (plan.strategy === 'parallel') {
      await this.executeParallel(plan.tasks, context, results, completedTasks);
    } else {
      await this.executeHybrid(plan.tasks, context, results, completedTasks);
    }

    return results;
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequential(
    tasks: AgentTask[],
    context: UserContext,
    results: Map<string, AgentTaskResult>,
    completedTasks: Set<string>
  ): Promise<void> {
    for (const task of tasks) {
      // Wait for dependencies
      await this.waitForDependencies(task, completedTasks);

      // Execute task
      const result = await this.executeTask(task, context);
      results.set(task.id, result);
      
      if (result.success) {
        completedTasks.add(task.id);
      }
    }
  }

  /**
   * Execute tasks in parallel where possible
   */
  private async executeParallel(
    tasks: AgentTask[],
    context: UserContext,
    results: Map<string, AgentTaskResult>,
    completedTasks: Set<string>
  ): Promise<void> {
    const taskPromises = tasks.map(async (task) => {
      await this.waitForDependencies(task, completedTasks);
      const result = await this.executeTask(task, context);
      results.set(task.id, result);
      if (result.success) {
        completedTasks.add(task.id);
      }
      return result;
    });

    await Promise.all(taskPromises);
  }

  /**
   * Execute tasks with hybrid strategy (parallel where possible, sequential where needed)
   */
  private async executeHybrid(
    tasks: AgentTask[],
    context: UserContext,
    results: Map<string, AgentTaskResult>,
    completedTasks: Set<string>
  ): Promise<void> {
    // Group tasks by dependency level
    const levels = this.groupByDependencyLevel(tasks);

    // Execute each level in parallel, but levels sequentially
    for (const level of levels) {
      const levelPromises = level.map(async (task) => {
        const result = await this.executeTask(task, context);
        results.set(task.id, result);
        if (result.success) {
          completedTasks.add(task.id);
        }
        return result;
      });

      await Promise.all(levelPromises);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: AgentTask,
    context: UserContext
  ): Promise<AgentTaskResult> {
    let agent;

    // Try dynamic agents first
    if (this.useDynamicRoles && task.context?.agentDefinition) {
      agent = this.dynamicAgents.get(task.context.agentDefinition.name);
    }

    // Fallback to static agents
    if (!agent) {
      agent = this.agents.get(task.agentType);
    }
    
    if (!agent) {
      return {
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        executionTimeMs: 0,
        warnings: [`No agent found for type: ${task.agentType}`]
      };
    }

    return await agent.execute(task, context);
  }

  /**
   * Wait for task dependencies to complete
   */
  private async waitForDependencies(
    task: AgentTask,
    completedTasks: Set<string>
  ): Promise<void> {
    if (!task.dependencies || task.dependencies.length === 0) {
      return;
    }

    // Poll until all dependencies are complete
    while (!task.dependencies.every(dep => completedTasks.has(dep))) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Group tasks by dependency level for hybrid execution
   */
  private groupByDependencyLevel(tasks: AgentTask[]): AgentTask[][] {
    const levels: AgentTask[][] = [];
    const processed = new Set<string>();

    while (processed.size < tasks.length) {
      const currentLevel = tasks.filter(task => 
        !processed.has(task.id) &&
        (task.dependencies || []).every(dep => processed.has(dep))
      );

      if (currentLevel.length === 0) break; // Circular dependency or error

      levels.push(currentLevel);
      currentLevel.forEach(task => processed.add(task.id));
    }

    return levels;
  }

  /**
   * Determine if tasks can be parallelized
   */
  private canParallelize(tasks: AgentTask[]): boolean {
    return tasks.some(task => !task.dependencies || task.dependencies.length === 0);
  }

  /**
   * Estimate total duration
   */
  private estimateDuration(tasks: AgentTask[]): number {
    // Rough estimate: 2 seconds per task
    return tasks.length * 2000;
  }

  /**
   * Select execution strategy
   */
  private selectStrategy(tasks: AgentTask[]): 'sequential' | 'parallel' | 'hybrid' {
    const hasDependencies = tasks.some(task => task.dependencies && task.dependencies.length > 0);
    const hasIndependent = tasks.some(task => !task.dependencies || task.dependencies.length === 0);

    if (!hasDependencies) return 'parallel';
    if (!hasIndependent) return 'sequential';
    return 'hybrid';
  }
}

// ============================================
// AGENT ORCHESTRATOR (Main Export)
// ============================================

export class AgentOrchestrator {
  private supervisor: SupervisorAgent;

  constructor(useDynamicRoles: boolean = true) {
    this.supervisor = new SupervisorAgent();
    this.supervisor.setDynamicRoles(useDynamicRoles);
  }

  /**
   * Enable or disable dynamic roles
   */
  setDynamicRoles(enabled: boolean): void {
    this.supervisor.setDynamicRoles(enabled);
  }

  /**
   * Orchestrate workflow generation with multi-agent system
   */
  async orchestrate(
    workflow: Workflow,
    context: UserContext
  ): Promise<{
    plan: OrchestrationPlan;
    results: Map<string, AgentTaskResult>;
    success: boolean;
    totalExecutionTime: number;
  }> {
    const startTime = Date.now();

    // Create orchestration plan
    const plan = await this.supervisor.createPlan(workflow, context);

    // Execute plan
    const results = await this.supervisor.executePlan(plan, context);

    // Check overall success
    const success = Array.from(results.values()).every(r => r.success);

    return {
      plan,
      results,
      success,
      totalExecutionTime: Date.now() - startTime
    };
  }

  /**
   * Get agent status and capabilities
   */
  getAgentCapabilities(): Record<AgentType, string[]> {
    return {
      architect: ['Design workflow architecture', 'Estimate complexity', 'Recommend agents'],
      instructor: ['Generate instructions', 'Fill templates', 'Refine content'],
      validator: ['Validate outputs', 'Check quality', 'Suggest improvements'],
      reviewer: ['Review workflows', 'Optimize performance', 'Identify issues'],
      documenter: ['Generate documentation', 'Create README', 'Write guides'],
      supervisor: ['Coordinate agents', 'Create plans', 'Execute strategies']
    };
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
