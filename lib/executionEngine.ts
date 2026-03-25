import type { Workflow, WorkflowStep } from "@/lib/types";

export type ExecutionContext = {
  workflow: Workflow;
  completedSteps: Set<string>;
  stepOutputs: Map<string, string>;
  executionPath: string[];
  loopCounters: Map<string, number>;
};

export type ExecutionResult = {
  stepId: string;
  output: string;
  status: "success" | "error" | "skipped";
  error?: string;
};

/**
 * Topological sort with dependency resolution
 * Returns execution order respecting dependencies and conditions
 */
export function resolveExecutionOrder(
  workflow: Workflow,
  context?: ExecutionContext
): string[] {
  const { steps, edges } = workflow;
  const stepMap = new Map(steps.map(s => [s.id, s]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  steps.forEach(s => {
    inDegree.set(s.id, s.dependencies?.length || 0);
    adjacency.set(s.id, []);
  });

  // Build adjacency from edges and dependencies
  edges.forEach(edge => {
    const list = adjacency.get(edge.from) || [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  });

  // Add dependency edges
  steps.forEach(step => {
    step.dependencies?.forEach(depId => {
      const list = adjacency.get(depId) || [];
      if (!list.includes(step.id)) {
        list.push(step.id);
        adjacency.set(depId, list);
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
      }
    });
  });

  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];

  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const step = stepMap.get(current);

    if (!step) continue;

    // Evaluate condition if present and context available
    if (step.condition && context) {
      const conditionMet = evaluateCondition(step.condition.if, context.stepOutputs);
      const nextStepId = conditionMet ? step.condition.then : step.condition.else;
      
      // Skip the non-taken branch
      const otherBranch = conditionMet ? step.condition.else : step.condition.then;
      markBranchSkipped(otherBranch, stepMap, inDegree, queue);
      
      if (!result.includes(nextStepId) && !queue.includes(nextStepId)) {
        queue.push(nextStepId);
      }
    }

    // Handle loops
    if (step.loop && context) {
      const counter = context.loopCounters.get(current) || 0;
      if (counter < step.loop.maxIterations) {
        // Add loop body steps to queue
        step.loop.body.forEach(bodyStepId => {
          const bodyStep = stepMap.get(bodyStepId);
          if (bodyStep && !result.includes(bodyStepId)) {
            const remainingDeps = bodyStep.dependencies?.filter(d => !result.includes(d)) || [];
            if (remainingDeps.length === 0 && !queue.includes(bodyStepId)) {
              queue.push(bodyStepId);
            }
          }
        });
        context.loopCounters.set(current, counter + 1);
      }
    }

    result.push(current);

    const neighbors = adjacency.get(current) || [];
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0 && !result.includes(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  // Check for cycles
  if (result.length !== steps.length) {
    const remaining = steps.filter(s => !result.includes(s.id));
    throw new Error(`Circular dependency detected in workflow. Remaining steps: ${remaining.map(s => s.id).join(", ")}`);
  }

  return result;
}

function markBranchSkipped(
  stepId: string,
  stepMap: Map<string, WorkflowStep>,
  inDegree: Map<string, number>,
  queue: string[]
): void {
  const step = stepMap.get(stepId);
  if (!step) return;

  // Remove from queue if present
  const idx = queue.indexOf(stepId);
  if (idx > -1) queue.splice(idx, 1);

  // Reduce in-degree of dependents so they can proceed
  stepMap.forEach((s, id) => {
    if (s.dependencies?.includes(stepId)) {
      const currentDegree = inDegree.get(id) || 0;
      inDegree.set(id, Math.max(0, currentDegree - 1));
    }
  });
}

/**
 * Evaluate a natural language condition using available step outputs
 */
export function evaluateCondition(
  condition: string,
  stepOutputs: Map<string, string>
): boolean {
  const outputs = Object.fromEntries(stepOutputs);
  const conditionLower = condition.toLowerCase();

  // Simple pattern matching for common conditions
  // "output contains X" -> check if any output contains X
  const containsMatch = conditionLower.match(/(?:output|result|it)\s+contains?\s+["']?([^"']+)["']?/);
  if (containsMatch) {
    const searchTerm = containsMatch[1].toLowerCase();
    return Object.values(outputs).some(o => o.toLowerCase().includes(searchTerm));
  }

  // "output is empty" / "output is not empty"
  if (conditionLower.includes("empty")) {
    const isEmptyCheck = conditionLower.includes("not") === false;
    const lastOutput = Array.from(stepOutputs.values()).pop() || "";
    return isEmptyCheck ? lastOutput.trim().length === 0 : lastOutput.trim().length > 0;
  }

  // "previous step succeeded"
  if (conditionLower.includes("succeeded") || conditionLower.includes("success")) {
    return stepOutputs.size > 0;
  }

  // Default: try to interpret as boolean expression
  // "X > Y", "X equals Y", etc.
  const equalsMatch = conditionLower.match(/(\w+)\s*(?:equals?|==|is)\s*["']?([^"']+)["']?/);
  if (equalsMatch) {
    const key = equalsMatch[1];
    const value = equalsMatch[2];
    const outputValue = outputs[key] || "";
    return outputValue.toLowerCase() === value.toLowerCase();
  }

  // Default to true for unparseable conditions (fail open)
  return true;
}

/**
 * Get steps that can execute in parallel
 */
export function getParallelizableSteps(
  workflow: Workflow,
  completedSteps: Set<string>
): string[][] {
  const { steps, edges } = workflow;
  const stepMap = new Map(steps.map(s => [s.id, s]));
  
  // Group steps by dependency depth
  const depthMap = new Map<string, number>();
  
  function getDepth(stepId: string): number {
    if (depthMap.has(stepId)) return depthMap.get(stepId)!;
    
    const step = stepMap.get(stepId);
    if (!step || !step.dependencies || step.dependencies.length === 0) {
      depthMap.set(stepId, 0);
      return 0;
    }
    
    const maxDepDepth = Math.max(...step.dependencies.map(getDepth));
    const depth = maxDepDepth + 1;
    depthMap.set(stepId, depth);
    return depth;
  }
  
  steps.forEach(s => getDepth(s.id));
  
  // Group by depth
  const groups = new Map<number, string[]>();
  depthMap.forEach((depth, id) => {
    const group = groups.get(depth) || [];
    group.push(id);
    groups.set(depth, group);
  });
  
  // Return groups where all dependencies are satisfied
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([, ids]) => ids.filter(id => {
      const step = stepMap.get(id);
      return step?.dependencies?.every(d => completedSteps.has(d)) ?? true;
    }))
    .filter(group => group.length > 0);
}

/**
 * Check if a step is ready to execute
 */
export function isStepReady(
  step: WorkflowStep,
  completedSteps: Set<string>
): boolean {
  if (step.dependencies && step.dependencies.length > 0) {
    return step.dependencies.every(dep => completedSteps.has(dep));
  }
  return true;
}

/**
 * Create execution context for a workflow run
 */
export function createExecutionContext(workflow: Workflow): ExecutionContext {
  return {
    workflow,
    completedSteps: new Set(),
    stepOutputs: new Map(),
    executionPath: [],
    loopCounters: new Map()
  };
}

/**
 * Get next executable steps given current state
 */
export function getNextSteps(
  workflow: Workflow,
  context: ExecutionContext
): WorkflowStep[] {
  return workflow.steps.filter(step => {
    if (context.completedSteps.has(step.id)) return false;
    return isStepReady(step, context.completedSteps);
  });
}
