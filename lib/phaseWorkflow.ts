// 4-Phase Workflow System with User Approval Checkpoints
// Implements spec-driven workflow generation with validation at each phase

import {
  Workflow,
  WorkflowPhase,
  IntentSpec,
  UserContext,
  ModelConfig,
  PhaseCheckpoint,
  validateWithSchema,
  IntentSpecSchema,
  WorkflowSchema
} from './schemas';
import { validationCheckpoint } from './validationCheckpoint';
import { agentOrchestrator } from './agentOrchestrator';
import { contextEngineer } from './contextEngineer';

// ============================================
// PHASE WORKFLOW TYPES
// ============================================

interface PhaseTransition {
  from: WorkflowPhase;
  to: WorkflowPhase;
  canProceed: boolean;
  requiresApproval: boolean;
  validationResult?: any;
}

interface PhaseExecutionResult {
  phase: WorkflowPhase;
  success: boolean;
  output: any;
  checkpoint: PhaseCheckpoint;
  nextPhase?: WorkflowPhase;
  requiresUserApproval: boolean;
}

interface WorkflowProgress {
  currentPhase: WorkflowPhase;
  completedPhases: WorkflowPhase[];
  pendingPhases: WorkflowPhase[];
  checkpoints: PhaseCheckpoint[];
  overallProgress: number;
}

// ============================================
// PHASE EXECUTOR
// ============================================

class PhaseExecutor {
  /**
   * Execute SPECIFY phase: User intent → Detailed spec
   */
  async executeSpecifyPhase(
    intent: string,
    context: UserContext,
    modelConfig: ModelConfig
  ): Promise<PhaseExecutionResult> {
    const startTime = Date.now();

    try {
      // Generate detailed specification from intent
      const spec = await this.generateSpecification(intent, context);

      // Validate specification
      const validation = await validationCheckpoint.validatePhase(
        'specify',
        { intent, context },
        spec,
        crypto.randomUUID()
      );

      // Create checkpoint
      const checkpoint: PhaseCheckpoint = {
        phase: 'specify',
        validated: validation.valid,
        userApproved: false,
        artifacts: ['IntentSpec'],
        issues: validation.errors.map(e => e.message),
        timestamp: new Date().toISOString(),
        validation
      };

      return {
        phase: 'specify',
        success: validation.valid,
        output: spec,
        checkpoint,
        nextPhase: validation.canProceed ? 'plan' : undefined,
        requiresUserApproval: !validation.valid || validation.warnings.length > 0
      };
    } catch (error) {
      return {
        phase: 'specify',
        success: false,
        output: null,
        checkpoint: {
          phase: 'specify',
          validated: false,
          userApproved: false,
          artifacts: [],
          issues: [(error as Error).message],
          timestamp: new Date().toISOString()
        },
        requiresUserApproval: true
      };
    }
  }

  /**
   * Execute PLAN phase: Spec → Workflow plan
   */
  async executePlanPhase(
    spec: IntentSpec,
    context: UserContext,
    modelConfig: ModelConfig
  ): Promise<PhaseExecutionResult> {
    try {
      // Generate workflow plan from specification
      const workflow = await this.generateWorkflowPlan(spec, context);

      // Validate workflow
      const validation = await validationCheckpoint.validatePhase(
        'plan',
        spec,
        workflow,
        workflow.id
      );

      // Create checkpoint
      const checkpoint: PhaseCheckpoint = {
        phase: 'plan',
        validated: validation.valid,
        userApproved: false,
        artifacts: ['Workflow'],
        issues: validation.errors.map(e => e.message),
        timestamp: new Date().toISOString(),
        validation
      };

      return {
        phase: 'plan',
        success: validation.valid,
        output: workflow,
        checkpoint,
        nextPhase: validation.canProceed ? 'tasks' : undefined,
        requiresUserApproval: !validation.valid || validation.warnings.length > 0
      };
    } catch (error) {
      return {
        phase: 'plan',
        success: false,
        output: null,
        checkpoint: {
          phase: 'plan',
          validated: false,
          userApproved: false,
          artifacts: [],
          issues: [(error as Error).message],
          timestamp: new Date().toISOString()
        },
        requiresUserApproval: true
      };
    }
  }

  /**
   * Execute TASKS phase: Workflow → Granular steps
   */
  async executeTasksPhase(
    workflow: Workflow,
    context: UserContext,
    modelConfig: ModelConfig
  ): Promise<PhaseExecutionResult> {
    try {
      // Use agent orchestrator to break down into tasks
      const orchestrationResult = await agentOrchestrator.orchestrate(workflow, context);

      // Validate tasks
      const validation = await validationCheckpoint.validatePhase(
        'tasks',
        workflow,
        orchestrationResult,
        workflow.id
      );

      // Create checkpoint
      const checkpoint: PhaseCheckpoint = {
        phase: 'tasks',
        validated: validation.valid,
        userApproved: false,
        artifacts: ['OrchestrationPlan', 'AgentTasks'],
        issues: validation.errors.map(e => e.message),
        timestamp: new Date().toISOString(),
        validation
      };

      return {
        phase: 'tasks',
        success: validation.valid && orchestrationResult.success,
        output: orchestrationResult,
        checkpoint,
        nextPhase: validation.canProceed ? 'execute' : undefined,
        requiresUserApproval: !validation.valid || validation.warnings.length > 0
      };
    } catch (error) {
      return {
        phase: 'tasks',
        success: false,
        output: null,
        checkpoint: {
          phase: 'tasks',
          validated: false,
          userApproved: false,
          artifacts: [],
          issues: [(error as Error).message],
          timestamp: new Date().toISOString()
        },
        requiresUserApproval: true
      };
    }
  }

  /**
   * Execute EXECUTE phase: Tasks → Generated instructions
   */
  async executeExecutePhase(
    workflow: Workflow,
    orchestrationResult: any,
    context: UserContext,
    modelConfig: ModelConfig
  ): Promise<PhaseExecutionResult> {
    try {
      // Generate final outputs using context engineering
      const engineeredContext = contextEngineer.engineerContext(
        workflow.intent,
        context,
        workflow.steps || [],
        modelConfig
      );

      // Execute workflow with optimized context
      const finalWorkflow = await this.executeWorkflow(
        workflow,
        engineeredContext,
        modelConfig
      );

      // Validate execution
      const validation = await validationCheckpoint.validatePhase(
        'execute',
        orchestrationResult,
        finalWorkflow,
        workflow.id
      );

      // Create checkpoint
      const checkpoint: PhaseCheckpoint = {
        phase: 'execute',
        validated: validation.valid,
        userApproved: false,
        artifacts: ['FinalWorkflow', 'GeneratedInstructions'],
        issues: validation.errors.map(e => e.message),
        timestamp: new Date().toISOString(),
        validation
      };

      return {
        phase: 'execute',
        success: validation.valid,
        output: finalWorkflow,
        checkpoint,
        requiresUserApproval: !validation.valid || validation.warnings.length > 0
      };
    } catch (error) {
      return {
        phase: 'execute',
        success: false,
        output: null,
        checkpoint: {
          phase: 'execute',
          validated: false,
          userApproved: false,
          artifacts: [],
          issues: [(error as Error).message],
          timestamp: new Date().toISOString()
        },
        requiresUserApproval: true
      };
    }
  }

  // Helper methods

  private async generateSpecification(
    intent: string,
    context: UserContext
  ): Promise<IntentSpec> {
    // Generate detailed specification from intent
    const spec: IntentSpec = {
      projectName: context.project || this.extractProjectName(intent),
      description: intent,
      audience: context.audience || 'General users',
      techStack: context.techStack ? context.techStack.split(',').map(t => t.trim()) : ['React', 'TypeScript'],
      constraints: context.constraints,
      successCriteria: this.extractSuccessCriteria(intent),
      priority: 'medium',
      estimatedComplexity: this.estimateComplexity(intent)
    };

    // Validate spec
    const validation = validateWithSchema(IntentSpecSchema, spec);
    if (!validation.success) {
      throw new Error(`Invalid specification: ${validation.errors}`);
    }

    return spec;
  }

  private async generateWorkflowPlan(
    spec: IntentSpec,
    context: UserContext
  ): Promise<Workflow> {
    // Generate workflow from specification
    const workflow: Workflow = {
      id: crypto.randomUUID(),
      intent: spec.description,
      spec,
      currentPhase: 'plan',
      steps: [],
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    // Validate workflow
    const validation = validateWithSchema(WorkflowSchema, workflow);
    if (!validation.success) {
      throw new Error(`Invalid workflow: ${validation.errors}`);
    }

    return workflow;
  }

  private async executeWorkflow(
    workflow: Workflow,
    engineeredContext: any,
    modelConfig: ModelConfig
  ): Promise<Workflow> {
    // Execute workflow with optimized context
    return {
      ...workflow,
      currentPhase: 'execute',
      status: 'completed',
      updatedAt: new Date().toISOString()
    };
  }

  private extractProjectName(intent: string): string {
    // Extract project name from intent
    const match = intent.match(/build\s+(?:a\s+)?(.+?)(?:\s+for|\s+that|\s+with|$)/i);
    return match ? match[1].trim() : 'Untitled Project';
  }

  private extractSuccessCriteria(intent: string): string[] {
    // Extract success criteria from intent
    const criteria: string[] = [];
    
    if (intent.toLowerCase().includes('user')) {
      criteria.push('User-friendly interface');
    }
    if (intent.toLowerCase().includes('fast') || intent.toLowerCase().includes('performance')) {
      criteria.push('High performance');
    }
    if (intent.toLowerCase().includes('secure')) {
      criteria.push('Security compliance');
    }
    
    if (criteria.length === 0) {
      criteria.push('Functional requirements met');
    }

    return criteria;
  }

  private estimateComplexity(intent: string): 'simple' | 'medium' | 'complex' {
    const wordCount = intent.split(/\s+/).length;
    
    if (wordCount < 10) return 'simple';
    if (wordCount < 30) return 'medium';
    return 'complex';
  }
}

// ============================================
// PHASE WORKFLOW MANAGER
// ============================================

export class PhaseWorkflowManager {
  private executor: PhaseExecutor;
  private workflowStates: Map<string, WorkflowProgress> = new Map();

  constructor() {
    this.executor = new PhaseExecutor();
  }

  /**
   * Execute complete 4-phase workflow
   */
  async executeWorkflow(
    intent: string,
    context: UserContext,
    modelConfig: ModelConfig,
    onPhaseComplete?: (result: PhaseExecutionResult) => Promise<boolean>
  ): Promise<{
    workflow: Workflow;
    checkpoints: PhaseCheckpoint[];
    success: boolean;
  }> {
    const workflowId = crypto.randomUUID();
    const checkpoints: PhaseCheckpoint[] = [];

    try {
      // Phase 1: SPECIFY
      const specifyResult = await this.executor.executeSpecifyPhase(intent, context, modelConfig);
      checkpoints.push(specifyResult.checkpoint);

      if (onPhaseComplete) {
        const approved = await onPhaseComplete(specifyResult);
        if (!approved) {
          throw new Error('User rejected SPECIFY phase');
        }
      }

      if (!specifyResult.success) {
        throw new Error('SPECIFY phase failed');
      }

      // Phase 2: PLAN
      const planResult = await this.executor.executePlanPhase(
        specifyResult.output,
        context,
        modelConfig
      );
      checkpoints.push(planResult.checkpoint);

      if (onPhaseComplete) {
        const approved = await onPhaseComplete(planResult);
        if (!approved) {
          throw new Error('User rejected PLAN phase');
        }
      }

      if (!planResult.success) {
        throw new Error('PLAN phase failed');
      }

      // Phase 3: TASKS
      const tasksResult = await this.executor.executeTasksPhase(
        planResult.output,
        context,
        modelConfig
      );
      checkpoints.push(tasksResult.checkpoint);

      if (onPhaseComplete) {
        const approved = await onPhaseComplete(tasksResult);
        if (!approved) {
          throw new Error('User rejected TASKS phase');
        }
      }

      if (!tasksResult.success) {
        throw new Error('TASKS phase failed');
      }

      // Phase 4: EXECUTE
      const executeResult = await this.executor.executeExecutePhase(
        planResult.output,
        tasksResult.output,
        context,
        modelConfig
      );
      checkpoints.push(executeResult.checkpoint);

      if (onPhaseComplete) {
        const approved = await onPhaseComplete(executeResult);
        if (!approved) {
          throw new Error('User rejected EXECUTE phase');
        }
      }

      return {
        workflow: executeResult.output,
        checkpoints,
        success: executeResult.success
      };
    } catch (error) {
      return {
        workflow: {
          id: workflowId,
          intent,
          currentPhase: 'specify',
          steps: [],
          createdAt: new Date().toISOString(),
          status: 'failed'
        },
        checkpoints,
        success: false
      };
    }
  }

  /**
   * Execute single phase
   */
  async executePhase(
    phase: WorkflowPhase,
    input: any,
    context: UserContext,
    modelConfig: ModelConfig
  ): Promise<PhaseExecutionResult> {
    switch (phase) {
      case 'specify':
        return this.executor.executeSpecifyPhase(input.intent, context, modelConfig);
      case 'plan':
        return this.executor.executePlanPhase(input.spec, context, modelConfig);
      case 'tasks':
        return this.executor.executeTasksPhase(input.workflow, context, modelConfig);
      case 'execute':
        return this.executor.executeExecutePhase(
          input.workflow,
          input.orchestrationResult,
          context,
          modelConfig
        );
    }
  }

  /**
   * Get workflow progress
   */
  getProgress(workflowId: string): WorkflowProgress | null {
    return this.workflowStates.get(workflowId) || null;
  }

  /**
   * Approve phase checkpoint
   */
  approvePhase(workflowId: string, phase: WorkflowPhase): void {
    validationCheckpoint.approveCheckpoint(workflowId, phase);
  }

  /**
   * Check if can transition to next phase
   */
  canTransition(from: WorkflowPhase, to: WorkflowPhase, workflowId: string): PhaseTransition {
    const checkpoint = validationCheckpoint.getLatestCheckpoint(workflowId);
    
    const phaseOrder: WorkflowPhase[] = ['specify', 'plan', 'tasks', 'execute'];
    const fromIndex = phaseOrder.indexOf(from);
    const toIndex = phaseOrder.indexOf(to);

    const canProceed = 
      toIndex === fromIndex + 1 && 
      checkpoint?.validated === true &&
      checkpoint?.userApproved === true;

    return {
      from,
      to,
      canProceed,
      requiresApproval: !checkpoint?.userApproved,
      validationResult: checkpoint?.validation
    };
  }
}

// Export singleton instance
export const phaseWorkflowManager = new PhaseWorkflowManager();
