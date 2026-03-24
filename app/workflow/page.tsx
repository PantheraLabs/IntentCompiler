"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepCard from "@/components/StepCard";
import type { UserContext, WorkflowStep, StepMetadata } from "@/lib/types";

type StoredWorkflow = {
  intent: string;
  context: UserContext;
  steps: WorkflowStep[];
};

type ExecuteResponse = {
  output?: string;
  error?: string;
};

export default function WorkflowPage() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [context, setContext] = useState<UserContext | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [outputs, setOutputs] = useState<{ stepId: number; output: string }[]>([]);
  const [runningIndex, setRunningIndex] = useState<number | null>(null);
  const [runAllLoading, setRunAllLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX_RETRIES = 2;

  useEffect(() => {
    const raw = sessionStorage.getItem("intentCompilerWorkflow");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredWorkflow;
      if (!parsed?.steps?.length) {
        router.push("/");
        return;
      }

      setIntent(parsed.intent || "");
      setContext(parsed.context);
      setSteps(parsed.steps.map((s) => ({
        ...s,
        metadata: { status: "idle", attempts: 0 }
      })));
      setOutputs([]);
    } catch (err) {
      console.error("Failed to parse workflow:", err);
      router.push("/");
    }
  }, [router]);

  const updateStepMetadata = (index: number, update: Partial<StepMetadata>) => {
    setSteps((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          metadata: { ...next[index].metadata, ...update } as StepMetadata
        };
      }
      return next;
    });
  };

  const runStep = async (index: number, isAuto = false): Promise<boolean> => {
    const step = steps[index];
    if (!step) return false;

    setRunningIndex(index);
    if (!isAuto) setError("");

    updateStepMetadata(index, { status: "running", error: undefined });

    let lastError = "";
    const currentAttempts = (step.metadata?.attempts || 0) + 1;
    updateStepMetadata(index, { attempts: currentAttempts });

    for (let tryCount = 0; tryCount <= MAX_RETRIES; tryCount += 1) {
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step,
            previousOutputs: outputs.filter((o) => o.stepId < step.id),
            userContext: context,
            shouldSummarize: steps.length > 5
          })
        });

        const data = (await res.json()) as ExecuteResponse & { summary?: string };
        if (!res.ok || !data.output) {
          throw new Error(data.error || "Step execution failed.");
        }

        setOutputs((prev) => {
          const filtered = prev.filter((o) => o.stepId !== step.id);
          return [...filtered, { stepId: step.id, output: data.output || "" }].sort((a, b) => a.stepId - b.stepId);
        });

        updateStepMetadata(index, { status: "completed", lastRun: Date.now() });
        setRunningIndex(null);
        return true;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unexpected error.";
        console.warn(`Attempt ${tryCount + 1} failed for step ${index + 1}:`, lastError);
        if (tryCount === MAX_RETRIES) break;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, tryCount)));
      }
    }

    updateStepMetadata(index, { status: "error", error: lastError });
    if (!isAuto) setError(lastError);
    setRunningIndex(null);
    return false;
  };

  const runAll = async (startIndex = 0) => {
    if (!steps.length) return;

    setRunAllLoading(true);
    setError("");

    for (let i = startIndex; i < steps.length; i += 1) {
      const success = await runStep(i, true);
      if (!success) {
        setError(`Workflow halted at step ${i + 1}.`);
        break;
      }
    }

    setRunAllLoading(false);
  };

  const resume = () => {
    const firstIncomplete = steps.findIndex((s) => s.metadata?.status !== "completed");
    if (firstIncomplete !== -1) {
      runAll(firstIncomplete);
    }
  };

  if (!steps.length) {
    return <main className="min-h-screen px-4 py-12 md:px-6" />;
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Intent</p>
              <p className="mt-2 text-sm text-text">{intent}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted">Progress</p>
              <p className="mt-1 text-sm font-medium text-text">
                {steps.filter((s) => s.metadata?.status === "completed").length} / {steps.length}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => runAll(0)}
              disabled={runAllLoading || runningIndex !== null}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runAllLoading ? "Running All..." : "Run All"}
            </button>

            {steps.some((s) => s.metadata?.status === "error" || (s.metadata?.status === "idle" && outputs.length > 0)) && (
              <button
                type="button"
                onClick={resume}
                disabled={runAllLoading || runningIndex !== null}
                className="rounded-lg border border-border bg-surfaceAlt px-4 py-2 text-sm font-semibold text-text transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resume
              </button>
            )}
          </div>
          {error ? <p className="mt-3 text-sm text-red-500 font-medium">{error}</p> : null}
        </div>

        <div className="grid gap-4">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              output={outputs.find((o) => o.stepId === step.id)?.output}
              running={runningIndex === index}
              onRun={() => runStep(index)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
