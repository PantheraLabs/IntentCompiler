"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepCard from "@/components/StepCard";
import type { UserContext, WorkflowStep } from "@/lib/types";

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
  const [outputs, setOutputs] = useState<string[]>([]);
  const [runningIndex, setRunningIndex] = useState<number | null>(null);
  const [runAllLoading, setRunAllLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("intentCompilerWorkflow");
    if (!raw) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(raw) as StoredWorkflow;
    if (!parsed?.steps?.length) {
      router.push("/");
      return;
    }

    setIntent(parsed.intent || "");
    setContext(parsed.context);
    setSteps(parsed.steps);
    setOutputs(new Array(parsed.steps.length).fill(""));
  }, [router]);

  const previousOutputs = useMemo(() => outputs.filter(Boolean), [outputs]);

  const runStep = async (index: number) => {
    if (!steps[index]) return;

    setRunningIndex(index);
    setError("");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: steps[index],
          previousOutputs: outputs.slice(0, index).filter(Boolean),
          userContext: context
        })
      });

      const data = (await res.json()) as ExecuteResponse;
      if (!res.ok || !data.output) {
        throw new Error(data.error || "Step execution failed.");
      }

      setOutputs((prev) => {
        const next = [...prev];
        next[index] = data.output || "";
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setRunningIndex(null);
    }
  };

  const runAll = async () => {
    if (!steps.length) return;

    setRunAllLoading(true);
    setError("");
    const nextOutputs = [...outputs];

    for (let i = 0; i < steps.length; i += 1) {
      setRunningIndex(i);
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: steps[i],
            previousOutputs: nextOutputs.slice(0, i).filter(Boolean),
            userContext: context
          })
        });

        const data = (await res.json()) as ExecuteResponse;
        if (!res.ok || !data.output) {
          throw new Error(data.error || `Failed at step ${i + 1}`);
        }

        nextOutputs[i] = data.output || "";
        setOutputs([...nextOutputs]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error.";
        setError(message);
        break;
      }
    }

    setRunningIndex(null);
    setRunAllLoading(false);
  };

  if (!steps.length) {
    return <main className="min-h-screen px-4 py-12 md:px-6" />;
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted">Intent</p>
          <p className="mt-2 text-sm text-text">{intent}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runAll}
              disabled={runAllLoading || runningIndex !== null}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runAllLoading ? "Running All..." : "Run All"}
            </button>
            <span className="text-xs text-muted">Completed outputs: {previousOutputs.length}</span>
          </div>
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="grid gap-4">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              output={outputs[index]}
              running={runningIndex === index}
              onRun={() => runStep(index)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
