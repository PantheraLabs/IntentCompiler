"use client";

import type { WorkflowStep } from "@/lib/types";

type StepCardProps = {
  step: WorkflowStep;
  output?: string;
  running?: boolean;
  onRun: () => Promise<void> | void;
};

export default function StepCard({ step, output, running, onRun }: StepCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Step {step.id}</p>
          <h3 className="text-lg font-semibold text-text">{step.role}</h3>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="rounded-lg border border-border bg-surfaceAlt px-3 py-1.5 text-sm text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Running..." : "Run Step"}
        </button>
      </div>

      <p className="rounded-lg border border-border/70 bg-surfaceAlt/60 p-3 text-sm text-text">{step.task}</p>

      <div className="mt-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-muted">Output</p>
        <div className="min-h-20 whitespace-pre-wrap rounded-lg border border-border/80 bg-black/20 p-3 text-sm text-text">
          {output || "No output yet."}
        </div>
      </div>
    </div>
  );
}
