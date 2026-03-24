export type UserContext = {
  project: string;
  audience: string;
  depth: string;
  style: string;
  constraints: string[];
};

export type WorkflowStep = {
  id: number;
  role: string;
  task: string;
};
