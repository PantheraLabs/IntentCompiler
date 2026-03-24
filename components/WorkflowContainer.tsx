"use client";

import { useMemo, useState } from "react";
import StepCard from "@/components/StepCard";
import ExecutionPanel from "@/components/ExecutionPanel";
import type { ModelConfig, UserContext, WorkflowStep } from "@/lib/types";

type WorkflowContainerProps = {
  intent: string;
  context: UserContext;
  initialSteps: WorkflowStep[];
  modelConfig: ModelConfig;
};

type ExecuteResponse = { output?: string; error?: string };

export default function WorkflowContainer({ intent, context, initialSteps, modelConfig }: WorkflowContainerProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(
    initialSteps.map((step) => ({ ...step, status: step.status ?? "idle", output: step.output ?? "" }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(() => steps.filter((step) => step.status === "success").length, [steps]);

  const patchStep = (index: number, patch: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const runStep = async (index: number) => {
    const step = steps[index];
    if (!step) return;

    setError("");
    setCurrentStepIndex(index);
    patchStep(index, { status: "running", error: "" });

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step,
          userContext: context,
          modelConfig,
          previousOutputs: steps.slice(0, index).map((s) => s.output || "").filter(Boolean)
        })
      });

      const data = (await res.json()) as ExecuteResponse;
      if (!res.ok || !data.output) {
        throw new Error(data.error || "Execution failed.");
      }

      patchStep(index, { output: data.output, status: "success", error: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed.";
      patchStep(index, { status: "error", error: message });
      setError(message);
      throw err;
    } finally {
      setCurrentStepIndex(null);
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    setError("");
    for (let i = 0; i < steps.length; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await runStep(i);
      } catch {
        break;
      }
    }
    setRunningAll(false);
  };

  const deleteStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((step, idx) => ({
          ...step,
          id: idx + 1
        }))
    );
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((step, idx) => ({ ...step, id: idx + 1 }));
    });
  };

  const updateTask = (index: number, task: string) => patchStep(index, { task, status: "idle" });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Intent</p>
        <p className="mt-1 text-sm text-text">{intent}</p>
        <p className="mt-2 text-xs text-muted">
          Provider: {modelConfig.provider} | Model: {modelConfig.model}
        </p>
      </section>

      <ExecutionPanel
        running={runningAll || currentStepIndex !== null}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        completed={completedCount}
        onRunAll={runAll}
        disabled={steps.length === 0}
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="grid gap-4">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            isCurrent={currentStepIndex === index}
            onRun={() => runStep(index)}
            onDelete={() => deleteStep(index)}
            onMoveUp={() => moveStep(index, -1)}
            onMoveDown={() => moveStep(index, 1)}
            onTaskChange={(value) => updateTask(index, value)}
          />
        ))}
      </div>
    </div>
  );
}

