// Validation Checkpoint System
// Ensures quality and correctness at every workflow phase

import { 
  WorkflowPhase, 
  ValidationResult, 
  PhaseCheckpoint,
  IntentSpec,
  Workflow,
  WorkflowStep,
  validateWithSchema,
  IntentSpecSchema,
  WorkflowSchema,
  WorkflowStepSchema
} from './schemas';

// ============================================
// VALIDATION CHECKPOINT CLASS
// ============================================

export class ValidationCheckpoint {
  private validationHistory: Map<string, PhaseCheckpoint[]> = new Map();
  
  /**
   * Validate a workflow phase with comprehensive checks
   */
  async validatePhase(
    phase: WorkflowPhase,
    input: unknown,
    output: unknown,
    workflowId: string
  ): Promise<ValidationResult> {
    const validators: Record<WorkflowPhase, (input: unknown, output: unknown) => Promise<ValidationResult>> = {
      'specify': this.validateSpecifyPhase.bind(this),
      'plan': this.validatePlanPhase.bind(this),
      'tasks': this.validateTasksPhase.bind(this),
      'execute': this.validateExecutePhase.bind(this)
    };
    
    const result = await validators[phase](input, output);
    
    // Store checkpoint
    this.storeCheckpoint(workflowId, phase, result);
    
    // Auto-repair if possible
    if (!result.valid && result.autoRepairable) {
      return this.attemptAutoRepair(phase, result, output);
    }
    
    return result;
  }
  
  /**
   * Validate SPECIFY phase: User intent → Detailed spec
   */
  private async validateSpecifyPhase(
    input: unknown,
    output: unknown
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: string[] = [];
    
    // Validate output is a valid IntentSpec
    const specValidation = validateWithSchema(IntentSpecSchema, output);
    
    if (!specValidation.success) {
      specValidation.errors.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          severity: 'error'
        });
      });
    }
    
    // Check if spec has enough detail
    const spec = output as IntentSpec;
    if (spec.description && spec.description.length < 50) {
      warnings.push('Description is quite brief. Consider adding more detail for better workflow generation.');
    }
    
    if (spec.techStack && spec.techStack.length === 0) {
      errors.push({
        field: 'techStack',
        message: 'Tech stack cannot be empty',
        severity: 'error'
      });
    }
    
    if (spec.successCriteria && spec.successCriteria.length === 0) {
      warnings.push('No success criteria defined. This may lead to ambiguous workflow goals.');
    }
    
    const valid = errors.filter(e => e.severity === 'error').length === 0;
    
    return {
      valid,
      phase: 'specify',
      errors,
      warnings,
      canProceed: valid,
      autoRepairable: errors.some(e => e.field === 'techStack' && spec.techStack?.length === 0),
      repairSuggestions: this.generateRepairSuggestions(errors)
    };
  }
  
  /**
   * Validate PLAN phase: Spec → Workflow plan
   */
  private async validatePlanPhase(
    input: unknown,
    output: unknown
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: string[] = [];
    
    // Validate output is a valid Workflow
    const workflowValidation = validateWithSchema(WorkflowSchema, output);
    
    if (!workflowValidation.success) {
      workflowValidation.errors.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          severity: 'error'
        });
      });
    }
    
    const workflow = output as Workflow;
    
    // Check if workflow has steps
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push({
        field: 'steps',
        message: 'Workflow must have at least one step',
        severity: 'error'
      });
    }
    
    // Check for circular dependencies
    if (workflow.steps && this.hasCircularDependencies(workflow.steps)) {
      errors.push({
        field: 'steps',
        message: 'Circular dependencies detected in workflow steps',
        severity: 'error'
      });
    }
    
    const valid = errors.filter(e => e.severity === 'error').length === 0;
    
    return {
      valid,
      phase: 'plan',
      errors,
      warnings,
      canProceed: valid,
      autoRepairable: false,
      repairSuggestions: this.generateRepairSuggestions(errors)
    };
  }
  
  /**
   * Validate TASKS phase: Plan → Granular workflow steps
   */
  private async validateTasksPhase(
    input: unknown,
    output: unknown
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: string[] = [];
    
    const workflow = output as Workflow;
    
    // Validate each step
    if (workflow.steps) {
      workflow.steps.forEach((step, index) => {
        const stepValidation = validateWithSchema(WorkflowStepSchema, step);
        
        if (!stepValidation.success) {
          stepValidation.errors.errors.forEach(err => {
            errors.push({
              field: `steps[${index}].${err.path.join('.')}`,
              message: err.message,
              severity: 'error'
            });
          });
        }
        
        // Check step has clear description
        if (step.description && step.description.length < 10) {
          warnings.push(`Step ${index + 1} has a very brief description`);
        }
        
        // Check dependencies exist
        if (step.dependencies) {
          step.dependencies.forEach(depId => {
            const depExists = workflow.steps?.some(s => s.id === depId);
            if (!depExists) {
              errors.push({
                field: `steps[${index}].dependencies`,
                message: `Dependency ${depId} does not exist`,
                severity: 'error'
              });
            }
          });
        }
      });
    }
    
    const valid = errors.filter(e => e.severity === 'error').length === 0;
    
    return {
      valid,
      phase: 'tasks',
      errors,
      warnings,
      canProceed: valid,
      autoRepairable: false,
      repairSuggestions: this.generateRepairSuggestions(errors)
    };
  }
  
  /**
   * Validate EXECUTE phase: Steps → Generated instructions
   */
  private async validateExecutePhase(
    input: unknown,
    output: unknown
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: string[] = [];
    
    const workflow = output as Workflow;
    
    // Check all steps have output
    if (workflow.steps) {
      workflow.steps.forEach((step, index) => {
        if (!step.output || step.output.trim().length === 0) {
          errors.push({
            field: `steps[${index}].output`,
            message: `Step ${index + 1} has no generated output`,
            severity: 'error'
          });
        }
        
        // Check confidence level
        if (step.confidence !== undefined && step.confidence < 0.7) {
          warnings.push(`Step ${index + 1} has low confidence (${step.confidence})`);
        }
      });
    }
    
    // Check workflow status
    if (workflow.status !== 'completed' && workflow.status !== 'active') {
      warnings.push(`Workflow status is ${workflow.status}, expected 'completed' or 'active'`);
    }
    
    const valid = errors.filter(e => e.severity === 'error').length === 0;
    
    return {
      valid,
      phase: 'execute',
      errors,
      warnings,
      canProceed: valid,
      autoRepairable: false,
      repairSuggestions: this.generateRepairSuggestions(errors)
    };
  }
  
  /**
   * Attempt to auto-repair validation errors
   */
  private async attemptAutoRepair(
    phase: WorkflowPhase,
    result: ValidationResult,
    output: unknown
  ): Promise<ValidationResult> {
    // Simple auto-repair logic
    if (phase === 'specify') {
      const spec = output as IntentSpec;
      
      // Auto-fill empty tech stack with defaults
      if (!spec.techStack || spec.techStack.length === 0) {
        spec.techStack = ['React', 'TypeScript', 'Node.js'];
        
        return {
          ...result,
          valid: true,
          canProceed: true,
          warnings: [...result.warnings, 'Auto-filled tech stack with defaults']
        };
      }
    }
    
    return result;
  }
  
  /**
   * Check for circular dependencies in workflow steps
   */
  private hasCircularDependencies(steps: WorkflowStep[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);
      
      const step = steps.find(s => s.id === stepId);
      if (!step || !step.dependencies) return false;
      
      for (const depId of step.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
      
      recursionStack.delete(stepId);
      return false;
    };
    
    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) return true;
      }
    }
    
    return false;
  }
  
  /**
   * Generate repair suggestions based on errors
   */
  private generateRepairSuggestions(errors: ValidationResult['errors']): string[] {
    const suggestions: string[] = [];
    
    errors.forEach(error => {
      if (error.field.includes('techStack')) {
        suggestions.push('Add at least one technology to the tech stack (e.g., React, Python, Node.js)');
      }
      if (error.field.includes('description')) {
        suggestions.push('Provide a more detailed description (at least 20 characters)');
      }
      if (error.field.includes('dependencies')) {
        suggestions.push('Ensure all step dependencies reference valid step IDs');
      }
      if (error.field.includes('output')) {
        suggestions.push('Generate output for all workflow steps');
      }
    });
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
  
  /**
   * Store checkpoint in history
   */
  private storeCheckpoint(
    workflowId: string,
    phase: WorkflowPhase,
    validation: ValidationResult
  ): void {
    const checkpoint: PhaseCheckpoint = {
      phase,
      validated: validation.valid,
      userApproved: false,
      artifacts: [],
      issues: validation.errors.map(e => e.message),
      timestamp: new Date().toISOString(),
      validation
    };
    
    if (!this.validationHistory.has(workflowId)) {
      this.validationHistory.set(workflowId, []);
    }
    
    this.validationHistory.get(workflowId)!.push(checkpoint);
  }
  
  /**
   * Get validation history for a workflow
   */
  getHistory(workflowId: string): PhaseCheckpoint[] {
    return this.validationHistory.get(workflowId) || [];
  }
  
  /**
   * Get latest checkpoint for a workflow
   */
  getLatestCheckpoint(workflowId: string): PhaseCheckpoint | null {
    const history = this.getHistory(workflowId);
    return history.length > 0 ? history[history.length - 1] : null;
  }
  
  /**
   * Mark checkpoint as user-approved
   */
  approveCheckpoint(workflowId: string, phase: WorkflowPhase): void {
    const history = this.validationHistory.get(workflowId);
    if (!history) return;
    
    const checkpoint = history.find(c => c.phase === phase);
    if (checkpoint) {
      checkpoint.userApproved = true;
    }
  }
}

// Export singleton instance
export const validationCheckpoint = new ValidationCheckpoint();
