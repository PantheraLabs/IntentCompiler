// Typed Schemas for Multi-Agent Workflow Reliability
// Using Zod for runtime validation and type safety

import { z } from 'zod';

// ============================================
// CORE WORKFLOW SCHEMAS
// ============================================

/**
 * Workflow Phase Enum
 * Defines the 4 phases of spec-driven workflow generation
 */
export const WorkflowPhaseSchema = z.enum([
  'specify',   // User intent → detailed spec
  'plan',      // Spec → workflow plan
  'tasks',     // Plan → granular workflow steps
  'execute'    // Steps → generated instructions/workflows
]);

export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>;

/**
 * Step Type Schema
 * Defines all possible step types in the workflow
 */
export const StepTypeSchema = z.enum([
  'instruction_role',
  'instruction_context',
  'analysis',
  'implementation',
  'testing',
  'documentation',
  'review'
]);

export type StepType = z.infer<typeof StepTypeSchema>;

/**
 * Agent Type Schema
 * Defines specialized agent types for multi-agent orchestration
 */
export const AgentTypeSchema = z.enum([
  'architect',     // Workflow architecture and design
  'instructor',    // Instruction generation and refinement
  'validator',     // Quality assurance and validation
  'reviewer',      // Workflow review and optimization
  'documenter',    // Documentation generation
  'supervisor'     // Orchestration and delegation
]);

export type AgentType = z.infer<typeof AgentTypeSchema>;

// ============================================
// INTENT & SPECIFICATION SCHEMAS
// ============================================

/**
 * Intent Specification Schema
 * The detailed specification generated from user intent
 */
export const IntentSpecSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  audience: z.string().min(1, 'Target audience is required'),
  techStack: z.array(z.string()).min(1, 'At least one technology is required'),
  constraints: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).min(1, 'At least one success criterion is required'),
  repository: z.string().url().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedComplexity: z.enum(['simple', 'medium', 'complex']).optional()
});

export type IntentSpec = z.infer<typeof IntentSpecSchema>;

/**
 * User Context Schema
 * Enhanced user context with validation
 */
export const UserContextSchema = z.object({
  project: z.string().optional(),
  techStack: z.string().optional(),
  audience: z.string().optional(),
  style: z.string().optional(),
  constraints: z.array(z.string()).default([]),
  tier: z.enum(['free', 'pro', 'enterprise']).default('free')
});

export type UserContext = z.infer<typeof UserContextSchema>;

// ============================================
// WORKFLOW STEP SCHEMAS
// ============================================

/**
 * Workflow Step Schema
 * Defines the structure of a workflow step with strict typing
 */
export const WorkflowStepSchema = z.object({
  id: z.string().uuid('Step ID must be a valid UUID'),
  stepType: StepTypeSchema,
  role: z.string().min(1, 'Role is required'),
  description: z.string().min(1, 'Description is required'),
  dependencies: z.array(z.string()).default([]),
  assignedAgent: AgentTypeSchema.optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']).default('pending'),
  output: z.string().optional(), // Generated instruction/workflow content
  confidence: z.number().min(0).max(1.1).optional(),
  metadata: z.record(z.any()).optional()
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

/**
 * Workflow Schema
 * Complete workflow with phases and validation
 */
export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  intent: z.string().min(1, 'Intent is required'),
  spec: IntentSpecSchema.optional(),
  currentPhase: WorkflowPhaseSchema.default('specify'),
  steps: z.array(WorkflowStepSchema).default([]),
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()).optional(),
  status: z.enum(['draft', 'active', 'completed', 'failed']).default('draft')
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// ============================================
// ACTION SCHEMAS (Explicit Outcomes)
// ============================================

/**
 * Step Action Schema
 * Defines explicit actions a step can take
 */
export const StepActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('request_clarification'),
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      required: z.boolean().default(true)
    })).min(1)
  }),
  z.object({
    type: z.literal('generate_output'),
    output: z.string(),
    confidence: z.number().min(0).max(1.1),
    qualityScore: z.number().min(0).max(110)
  }),
  z.object({
    type: z.literal('delegate_to_agent'),
    agentType: AgentTypeSchema,
    task: z.string(),
    reason: z.string().optional()
  }),
  z.object({
    type: z.literal('wait_for_dependency'),
    dependencyId: z.string().uuid(),
    estimatedWaitTime: z.number().optional()
  }),
  z.object({
    type: z.literal('skip'),
    reason: z.string().min(1, 'Skip reason is required')
  }),
  z.object({
    type: z.literal('fail'),
    error: z.string(),
    retryable: z.boolean().default(false)
  })
]);

export type StepAction = z.infer<typeof StepActionSchema>;

// ============================================
// VALIDATION & CHECKPOINT SCHEMAS
// ============================================

/**
 * Validation Result Schema
 * Result of validating a phase or step
 */
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  phase: WorkflowPhaseSchema,
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info'])
  })).default([]),
  warnings: z.array(z.string()).default([]),
  canProceed: z.boolean(),
  autoRepairable: z.boolean().default(false),
  repairSuggestions: z.array(z.string()).default([])
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Phase Checkpoint Schema
 * Checkpoint between workflow phases
 */
export const PhaseCheckpointSchema = z.object({
  phase: WorkflowPhaseSchema,
  validated: z.boolean().default(false),
  userApproved: z.boolean().default(false),
  artifacts: z.array(z.string()).default([]),
  issues: z.array(z.string()).default([]),
  timestamp: z.date().or(z.string().datetime()),
  validation: ValidationResultSchema.optional()
});

export type PhaseCheckpoint = z.infer<typeof PhaseCheckpointSchema>;

// ============================================
// MULTI-AGENT ORCHESTRATION SCHEMAS
// ============================================

/**
 * Agent Task Schema
 * Task delegated to a specialized agent
 */
export const AgentTaskSchema = z.object({
  id: z.string().uuid(),
  agentType: AgentTypeSchema,
  task: z.string(),
  context: z.record(z.any()).optional(),
  dependencies: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'failed']).default('pending'),
  result: z.any().optional()
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;

/**
 * Orchestration Plan Schema
 * Supervisor's plan for multi-agent coordination
 */
export const OrchestrationPlanSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  tasks: z.array(AgentTaskSchema),
  parallelizable: z.boolean().default(false),
  estimatedDuration: z.number().optional(),
  strategy: z.enum(['sequential', 'parallel', 'hybrid']).default('sequential')
});

export type OrchestrationPlan = z.infer<typeof OrchestrationPlanSchema>;

// ============================================
// QUESTION SCHEMAS (Intelligent Questioning)
// ============================================

/**
 * Question Type Schema
 */
export const QuestionTypeSchema = z.enum([
  'input',
  'select',
  'multiselect',
  'textarea',
  'confirmation'
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * Question Schema
 * Enhanced question schema for intelligent questioning
 */
export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  question: z.string().min(1, 'Question text is required'),
  placeholder: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  required: z.boolean().default(true),
  minSelections: z.number().optional(),
  followUp: z.record(z.string()).optional(),
  defaultValue: z.string().optional()
});

export type Question = z.infer<typeof QuestionSchema>;

/**
 * Question Analysis Schema
 * Result of analyzing intent for missing information
 */
export const QuestionAnalysisSchema = z.object({
  needsQuestions: z.boolean(),
  questions: z.array(QuestionSchema).default([]),
  confidence: z.number().min(0).max(1),
  inferredContext: UserContextSchema.optional()
});

export type QuestionAnalysis = z.infer<typeof QuestionAnalysisSchema>;

// ============================================
// MODEL CONFIG SCHEMAS
// ============================================

/**
 * Provider Schema
 */
export const ProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'meta',
  'mistral',
  'cohere',
  'local'
]);

export type Provider = z.infer<typeof ProviderSchema>;

/**
 * Model Config Schema
 */
export const ModelConfigSchema = z.object({
  provider: ProviderSchema,
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(100000).default(4000),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  stop: z.array(z.string()).optional()
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export const Schemas = {
  // Core
  WorkflowPhase: WorkflowPhaseSchema,
  StepType: StepTypeSchema,
  AgentType: AgentTypeSchema,
  
  // Intent & Spec
  IntentSpec: IntentSpecSchema,
  UserContext: UserContextSchema,
  
  // Workflow
  WorkflowStep: WorkflowStepSchema,
  Workflow: WorkflowSchema,
  
  // Actions
  StepAction: StepActionSchema,
  
  // Validation
  ValidationResult: ValidationResultSchema,
  PhaseCheckpoint: PhaseCheckpointSchema,
  
  // Orchestration
  AgentTask: AgentTaskSchema,
  OrchestrationPlan: OrchestrationPlanSchema,
  
  // Questions
  Question: QuestionSchema,
  QuestionAnalysis: QuestionAnalysisSchema,
  
  // Model
  Provider: ProviderSchema,
  ModelConfig: ModelConfigSchema
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate data against a schema with detailed error reporting
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Partial validation (for updates)
 */
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: Partial<T> } | { success: false; errors: z.ZodError } {
  const partialSchema = schema.partial();
  const result = partialSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
