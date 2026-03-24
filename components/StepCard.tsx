"use client";

import React from "react";
import type { WorkflowStep } from "@/lib/types";

type StepCardProps = {
  step: WorkflowStep;
  output?: string;
  running?: boolean;
  onRun: () => Promise<boolean> | void;
};

export default function StepCard({ step, output, running, onRun }: StepCardProps) {
  const status = step.metadata?.status || "idle";
  const error = step.metadata?.error;
  const attempts = step.metadata?.attempts || 0;

  const statusColors = {
    idle: "bg-muted/20 text-muted",
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  return (
    <div className={`rounded-xl border p-5 shadow-card transition-all ${
      status === "running" ? "border-blue-500/50 bg-blue-500/5" : "border-border bg-surface"
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-muted">Step {step.id}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border ${statusColors[status]}`}>
              {status}
            </span>
            {attempts > 1 && (
              <span className="text-[10px] text-muted">({attempts} attempts)</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-text">{step.role}</h3>
        </div>
        <button
          type="button"
          onClick={() => onRun()}
          disabled={running}
          className="rounded-lg border border-border bg-surfaceAlt px-3 py-1.5 text-sm text-text transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Running..." : status === "completed" ? "Rerun" : "Run Step"}
        </button>
      </div>

      <p className="rounded-lg border border-border/70 bg-surfaceAlt/60 p-3 text-sm text-text">{step.task}</p>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <p className="font-semibold">Error:</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted">Output</p>
          {step.metadata?.lastRun && (
            <p className="text-[10px] text-muted">
              Last run: {new Date(step.metadata.lastRun).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="min-h-24 whitespace-pre-wrap rounded-lg border border-border/80 bg-black/40 p-3 text-sm text-text font-mono">
          {output || (status === "running" ? "Processing..." : "No output yet.")}
        </div>
      </div>
    </div>
  );
}
