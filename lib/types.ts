export type UserContext = {
  project: string;
  audience: string;
  depth: string;
  style: string;
  tone?: string;
  constraints: string[];
};

export type Provider = "openai" | "groq" | "aicc" | "ollama";

export type ExecutionStatus = "idle" | "running" | "success" | "error";

export type ModelConfig = {
  provider: Provider;
  model: string;
};

export type WorkflowStep = {
  id: number;
  role: string;
  task: string;
  stepType?: "research" | "write" | "code" | "analysis" | "plan";
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
  }>;
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
