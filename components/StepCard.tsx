"use client";

import type { WorkflowStep } from "@/lib/types";

type StepCardProps = {
  step: WorkflowStep;
  index: number;
  total: number;
  isCurrent: boolean;
  onRun: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTaskChange: (value: string) => void;
};

const statusClass: Record<NonNullable<WorkflowStep["status"]>, string> = {
  idle: "border-border bg-surface",
  running: "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]",
  success: "border-emerald-400/40 bg-emerald-400/10",
  error: "border-rose-400/50 bg-rose-400/10"
};

export default function StepCard({
  step,
  index,
  total,
  isCurrent,
  onRun,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTaskChange
}: StepCardProps) {
  const status = step.status ?? "idle";
  const showOutput = status !== "idle" || Boolean(step.output);

  return (
    <article
      className={`rounded-2xl border p-6 transition-all duration-500 ease-out backdrop-blur-xl shadow-lg ${statusClass[status]} ${
        isCurrent ? "translate-y-[-4px] shadow-xl shadow-accent/5" : "translate-y-0"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">Step {index + 1}</p>
          <p className="text-sm font-semibold text-text">{step.role}</p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
            status === "running"
              ? "bg-cyan-300/20 text-cyan-300"
              : status === "success"
              ? "bg-emerald-300/20 text-emerald-300"
              : status === "error"
              ? "bg-rose-300/20 text-rose-300"
              : "bg-white/10 text-muted"
          }`}
        >
          {status}
        </span>
      </div>

      <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Task</label>
      <textarea
        value={step.task}
        onChange={(e) => onTaskChange(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={status === "running"}
          className="rounded-md border border-border bg-surfaceAlt px-3 py-1.5 text-xs text-text transition hover:border-accent disabled:opacity-50"
        >
          {status === "running" ? "Running..." : "Run Step"}
        </button>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded-md border border-border bg-surfaceAlt px-2 py-1.5 text-xs text-text transition hover:border-accent disabled:opacity-50"
        >
          Move Up
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded-md border border-border bg-surfaceAlt px-2 py-1.5 text-xs text-text transition hover:border-accent disabled:opacity-50"
        >
          Move Down
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20"
        >
          Delete
        </button>
      </div>

      {showOutput ? (
        <div className="mt-4 animate-[fadeIn_220ms_ease-out]">
          <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted">Output</p>
          <div className="rounded-lg border border-border/80 bg-black/20 p-3 text-sm text-text">
            {status === "running" ? <div className="h-16 animate-pulse rounded bg-white/5" /> : step.output || ""}
          </div>
        </div>
      ) : null}

      {status === "error" && step.error ? <p className="mt-3 text-xs text-rose-300">{step.error}</p> : null}
    </article>
  );
}
