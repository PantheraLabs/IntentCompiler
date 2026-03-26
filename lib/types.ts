export type UserContext = {
  project: string;
  audience: string;
  techStack?: string;
  depth: string;
  style: string;
  tone?: string;
  constraints: string[];
};

export type VibeTemplate = {
  id: string;
  name: string;
  description: string;
  context: {
    project: string;
    audience: string;
    tech_stack: string;
    style: string;
    constraints: string[];
  };
  isBuiltIn?: boolean;
  createdAt?: string;
};

export type Provider = "groq" | "openrouter" | "ollama" | "openai";

export type ExecutionStatus = "idle" | "running" | "success" | "error";

export type ModelConfig = {
  provider: Provider;
  model: string;
};

export type WorkflowStep = {
  id: string;
  role: string;
  task: string;
  stepType?: "research" | "write" | "code" | "analysis" | "plan" | "condition" | "loop" | "instruction_role" | "instruction_context" | "instruction_rules" | "instruction_assembly";
  status?: ExecutionStatus;
  output?: string;
  error?: string;
  outputFormat?: "markdown" | "bullets" | "json" | "table" | "plain";
  mustInclude?: string[];
  mustAvoid?: string[];
  acceptanceTests?: string[];
  qualityBar?: string;
  warnings?: string[];
  logs?: Array<{
    attempt: number;
    output: string;
    warnings: string[];
    timestamp: string;
    quality?: { score: number; issues: number };
  }>;
  // Section name for instruction assembly
  sectionName?: string;
  // Branching and flow control
  condition?: {
    if: string;
    then: string;
    else: string;
  };
  loop?: {
    for: string;
    body: string[];
    maxIterations: number;
  };
  dependencies?: string[];
  // Tool execution
  tool?: {
    mode: "llm" | "shell" | "http" | "db" | "search" | "file";
    config: Record<string, unknown>;
  };
};

export type WorkflowEdge = {
  from: string;
  to: string;
  condition?: string;
};

export type Workflow = {
  id: string;
  name: string;
  intent: string;
  context: UserContext;
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredWorkflow = {
  intent: string;
  context: UserContext;
  modelConfig: ModelConfig;
  steps: WorkflowStep[];
};

export type InstructionContext = {
  project: string;
  audience: string;
  style: string;
  constraints: string[];
};

export type GenerateInstructionRequest = {
  intent: string;
  context: InstructionContext;
  target: "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
  modelConfig?: Partial<ModelConfig>;
};

export type IntentRefinement = {
  interpreted_intent: string;
  assumptions: string[];
  clarified_goal: string;
};

export type StructuredContext = {
  project: string;
  audience: string;
  tech_stack: string;
  constraints: string[];
};

export type BehaviorDefinition = {
  role: string;
  objectives: string[];
  rules: string[];
  execution_style: string;
  output_format: string;
};
