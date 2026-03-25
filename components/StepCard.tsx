"use client";

import ReactMarkdown from "react-markdown";
import type { WorkflowStep } from "@/lib/types";

type StepCardProps = {
  step: WorkflowStep;
  index: number;
  total: number;
  isCurrent: boolean;
  onRun: () => void;
  onRerun: () => void;
  onSkip: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTaskChange: (value: string) => void;
  onCriteriaChange: (patch: Partial<WorkflowStep>) => void;
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
  onRerun,
  onSkip,
  onDelete,
  onMoveUp,
  onMoveDown,
  onTaskChange,
  onCriteriaChange
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
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted">
        <span className="rounded-full border border-border px-2 py-0.5">type: {step.stepType || "analysis"}</span>
        <span className="rounded-full border border-border px-2 py-0.5">format: {step.outputFormat || "markdown"}</span>
      </div>

      <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Task</label>
      <textarea
        value={step.task}
        onChange={(e) => onTaskChange(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
      />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Output Format</label>
          <select
            value={step.outputFormat || "markdown"}
            onChange={(e) => onCriteriaChange({ outputFormat: e.target.value as WorkflowStep["outputFormat"] })}
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
          >
            <option value="markdown">Markdown</option>
            <option value="bullets">Bullets</option>
            <option value="json">JSON</option>
            <option value="table">Table</option>
            <option value="plain">Plain</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Step Type</label>
          <select
            value={step.stepType || "analysis"}
            onChange={(e) => onCriteriaChange({ stepType: e.target.value as WorkflowStep["stepType"] })}
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
          >
            <option value="analysis">Analysis</option>
            <option value="research">Research</option>
            <option value="plan">Plan</option>
            <option value="write">Write</option>
            <option value="code">Code</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Quality Bar</label>
          <input
            value={step.qualityBar || ""}
            onChange={(e) => onCriteriaChange({ qualityBar: e.target.value })}
            placeholder="Short rubric sentence"
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Must Include</label>
          <textarea
            value={(step.mustInclude || []).join("\n")}
            onChange={(e) => onCriteriaChange({ mustInclude: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })}
            rows={3}
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Must Avoid</label>
          <textarea
            value={(step.mustAvoid || []).join("\n")}
            onChange={(e) => onCriteriaChange({ mustAvoid: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })}
            rows={3}
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Acceptance Tests</label>
          <textarea
            value={(step.acceptanceTests || []).join("\n")}
            onChange={(e) => onCriteriaChange({ acceptanceTests: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })}
            rows={2}
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
          />
        </div>
      </div>

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
          onClick={onRerun}
          disabled={status === "running"}
          className="rounded-md border border-border bg-surfaceAlt px-2 py-1.5 text-xs text-text transition hover:border-accent disabled:opacity-50"
        >
          Rerun
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={status === "running"}
          className="rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          Skip
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
          <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted">Output ({step.outputFormat || "markdown"})</p>
          <div className="rounded-lg border border-border/80 bg-black/20 p-4 text-sm text-text">
            {status === "running" ? (
              <div className="h-24 animate-pulse rounded bg-white/5" />
            ) : step.output ? (
              <div className="prose prose-invert prose-sm max-w-none">
                {step.outputFormat === "json" ? (
                  <pre className="overflow-x-auto rounded bg-black/40 p-3 font-mono text-xs text-cyan-300">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(step.output), null, 2);
                      } catch {
                        return step.output;
                      }
                    })()}
                  </pre>
                ) : (
                  <ReactMarkdown>{step.output}</ReactMarkdown>
                )}
              </div>
            ) : (
              <span className="italic text-muted/60">No output yet.</span>
            )}
          </div>
        </div>
      ) : null}

      {step.warnings && step.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200">
          <p className="mb-1 font-semibold uppercase tracking-[0.12em]">Acceptance Warnings</p>
          <ul className="space-y-1">
            {step.warnings.map((warning, idx) => (
              <li key={`${warning}-${idx}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {step.logs && step.logs.length > 0 ? (
        <div className="mt-3 rounded-lg border border-border/60 bg-black/10 p-2 text-xs text-muted">
          <p className="mb-1 font-semibold uppercase tracking-[0.12em]">Execution Log</p>
          <ul className="space-y-1">
            {step.logs.map((log) => (
              <li key={`${log.timestamp}-${log.attempt}`}>
                Attempt {log.attempt} · {new Date(log.timestamp).toLocaleTimeString()} · {log.warnings.length} warnings
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status === "error" && step.error ? <p className="mt-3 text-xs text-rose-300">{step.error}</p> : null}
    </article>
  );
}
