// Action Schemas for Explicit Step Outcomes
// Eliminates ambiguity by defining exact allowed actions

import { z } from 'zod';
import { AgentTypeSchema, QuestionSchema } from './schemas';

// ============================================
// STEP EXECUTION ACTIONS
// ============================================

/**
 * Request Clarification Action
 * When a step needs more information from the user
 */
export const RequestClarificationActionSchema = z.object({
  type: z.literal('request_clarification'),
  questions: z.array(QuestionSchema).min(1, 'At least one question is required'),
  reason: z.string().optional(),
  canProceedWithoutAnswer: z.boolean().default(false)
});

/**
 * Generate Output Action
 * When a step successfully generates its output
 */
export const GenerateOutputActionSchema = z.object({
  type: z.literal('generate_output'),
  output: z.string().min(1, 'Output cannot be empty'),
  confidence: z.number().min(0).max(1.1),
  qualityScore: z.number().min(0).max(110),
  warnings: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional()
});

/**
 * Delegate to Agent Action
 * When a step needs to delegate work to a specialized agent
 */
export const DelegateToAgentActionSchema = z.object({
  type: z.literal('delegate_to_agent'),
  agentType: AgentTypeSchema,
  task: z.string().min(1, 'Task description is required'),
  context: z.record(z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  reason: z.string().optional()
});

/**
 * Wait for Dependency Action
 * When a step is blocked by dependencies
 */
export const WaitForDependencyActionSchema = z.object({
  type: z.literal('wait_for_dependency'),
  dependencyId: z.string().uuid('Dependency ID must be a valid UUID'),
  dependencyName: z.string().optional(),
  estimatedWaitTime: z.number().optional(),
  canTimeout: z.boolean().default(false),
  timeoutSeconds: z.number().optional()
});

/**
 * Skip Action
 * When a step should be skipped
 */
export const SkipActionSchema = z.object({
  type: z.literal('skip'),
  reason: z.string().min(1, 'Skip reason is required'),
  impact: z.enum(['none', 'minor', 'moderate', 'major']).default('minor'),
  userApprovalRequired: z.boolean().default(false)
});

/**
 * Fail Action
 * When a step fails
 */
export const FailActionSchema = z.object({
  type: z.literal('fail'),
  error: z.string().min(1, 'Error message is required'),
  errorCode: z.string().optional(),
  retryable: z.boolean().default(false),
  maxRetries: z.number().default(3),
  currentRetry: z.number().default(0),
  stackTrace: z.string().optional()
});

/**
 * Retry Action
 * When a step needs to retry
 */
export const RetryActionSchema = z.object({
  type: z.literal('retry'),
  reason: z.string(),
  retryCount: z.number().min(0),
  maxRetries: z.number().default(3),
  backoffMs: z.number().default(1000),
  modifiedInput: z.record(z.any()).optional()
});

/**
 * Complete Action
 * When a step completes successfully
 */
export const CompleteActionSchema = z.object({
  type: z.literal('complete'),
  output: z.string(),
  confidence: z.number().min(0).max(1.1),
  executionTimeMs: z.number().optional(),
  tokensUsed: z.number().optional()
});

// ============================================
// UNIFIED STEP ACTION SCHEMA
// ============================================

/**
 * Step Action Schema (Discriminated Union)
 * All possible actions a step can take
 */
export const StepActionSchema = z.discriminatedUnion('type', [
  RequestClarificationActionSchema,
  GenerateOutputActionSchema,
  DelegateToAgentActionSchema,
  WaitForDependencyActionSchema,
  SkipActionSchema,
  FailActionSchema,
  RetryActionSchema,
  CompleteActionSchema
]);

export type StepAction = z.infer<typeof StepActionSchema>;

// ============================================
// WORKFLOW-LEVEL ACTIONS
// ============================================

/**
 * Workflow Action Schema
 * Actions that affect the entire workflow
 */
export const WorkflowActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pause'),
    reason: z.string(),
    resumable: z.boolean().default(true)
  }),
  z.object({
    type: z.literal('resume'),
    fromPhase: z.enum(['specify', 'plan', 'tasks', 'execute'])
  }),
  z.object({
    type: z.literal('cancel'),
    reason: z.string(),
    saveProgress: z.boolean().default(true)
  }),
  z.object({
    type: z.literal('restart'),
    fromPhase: z.enum(['specify', 'plan', 'tasks', 'execute']).default('specify'),
    preserveContext: z.boolean().default(true)
  }),
  z.object({
    type: z.literal('complete'),
    finalOutput: z.string(),
    allStepsCompleted: z.boolean(),
    qualityScore: z.number().min(0).max(110)
  })
]);

export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;

// ============================================
// AGENT ORCHESTRATION ACTIONS
// ============================================

/**
 * Agent Orchestration Action Schema
 * Actions for multi-agent coordination
 */
export const AgentOrchestrationActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('assign_task'),
    agentType: AgentTypeSchema,
    taskId: z.string().uuid(),
    priority: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  z.object({
    type: z.literal('reassign_task'),
    taskId: z.string().uuid(),
    fromAgent: AgentTypeSchema,
    toAgent: AgentTypeSchema,
    reason: z.string()
  }),
  z.object({
    type: z.literal('aggregate_results'),
    taskIds: z.array(z.string().uuid()).min(1),
    strategy: z.enum(['merge', 'select_best', 'vote', 'weighted_average'])
  }),
  z.object({
    type: z.literal('escalate_to_supervisor'),
    taskId: z.string().uuid(),
    issue: z.string(),
    requiresHumanIntervention: z.boolean().default(false)
  })
]);

export type AgentOrchestrationAction = z.infer<typeof AgentOrchestrationActionSchema>;

// ============================================
// ACTION EXECUTION RESULT
// ============================================

/**
 * Action Execution Result Schema
 * Result of executing an action
 */
export const ActionExecutionResultSchema = z.object({
  actionType: z.string(),
  success: z.boolean(),
  output: z.any().optional(),
  error: z.string().optional(),
  executionTimeMs: z.number().optional(),
  nextAction: StepActionSchema.optional(),
  metadata: z.record(z.any()).optional()
});

export type ActionExecutionResult = z.infer<typeof ActionExecutionResultSchema>;

// ============================================
// ACTION VALIDATORS
// ============================================

/**
 * Validate a step action
 */
export function validateStepAction(action: unknown): {
  valid: boolean;
  action?: StepAction;
  error?: string;
} {
  const result = StepActionSchema.safeParse(action);
  
  if (result.success) {
    return { valid: true, action: result.data };
  }
  
  return {
    valid: false,
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  };
}

/**
 * Validate a workflow action
 */
export function validateWorkflowAction(action: unknown): {
  valid: boolean;
  action?: WorkflowAction;
  error?: string;
} {
  const result = WorkflowActionSchema.safeParse(action);
  
  if (result.success) {
    return { valid: true, action: result.data };
  }
  
  return {
    valid: false,
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  };
}

/**
 * Check if action is retryable
 */
export function isRetryableAction(action: StepAction): boolean {
  if (action.type === 'fail') {
    return action.retryable && action.currentRetry < action.maxRetries;
  }
  
  if (action.type === 'retry') {
    return action.retryCount < action.maxRetries;
  }
  
  return false;
}

/**
 * Check if action requires user approval
 */
export function requiresUserApproval(action: StepAction | WorkflowAction): boolean {
  if ('userApprovalRequired' in action) {
    return action.userApprovalRequired;
  }
  
  // Certain actions always require approval
  if (action.type === 'cancel' || action.type === 'restart') {
    return true;
  }
  
  return false;
}

/**
 * Get next action based on current action result
 */
export function getNextAction(
  currentAction: StepAction,
  result: ActionExecutionResult
): StepAction | null {
  // If action failed and is retryable, return retry action
  if (!result.success && currentAction.type === 'fail' && currentAction.retryable) {
    return {
      type: 'retry',
      reason: currentAction.error,
      retryCount: currentAction.currentRetry + 1,
      maxRetries: currentAction.maxRetries,
      backoffMs: 1000 * Math.pow(2, currentAction.currentRetry) // Exponential backoff
    };
  }
  
  // If retry succeeded, return complete action
  if (result.success && currentAction.type === 'retry') {
    return {
      type: 'complete',
      output: result.output as string,
      confidence: 0.9,
      executionTimeMs: result.executionTimeMs
    };
  }
  
  // If waiting for dependency and it's now available, generate output
  if (currentAction.type === 'wait_for_dependency' && result.success) {
    return {
      type: 'generate_output',
      output: result.output as string,
      confidence: 1.0,
      qualityScore: 100,
      warnings: []
    };
  }
  
  return null;
}
