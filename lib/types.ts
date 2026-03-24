export type UserContext = {
  project: string;
  audience: string;
  depth: string;
  style: string;
  constraints: string[];
};

export type StepMetadata = {
  status: "idle" | "running" | "completed" | "error";
  error?: string;
  attempts?: number;
  lastRun?: number;
};

export type WorkflowStep = {
  id: number;
  role: string;
  task: string;
  metadata?: StepMetadata;
};

export type ExecutionState = {
  previousOutputs: { stepId: number; output: string }[];
  context: UserContext;
  summary?: string;
};
