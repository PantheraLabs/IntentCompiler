export type UserContext = {
  project: string;
  audience: string;
  depth: string;
  style: string;
  tone?: string;
  constraints: string[];
};

export type Provider = "openai" | "groq";

export type ExecutionStatus = "idle" | "running" | "success" | "error";

export type ModelConfig = {
  provider: Provider;
  model: string;
};

export type WorkflowStep = {
  id: number;
  role: string;
  task: string;
  status?: ExecutionStatus;
  output?: string;
  error?: string;
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
  target: "claude" | "agents" | "generic";
};
