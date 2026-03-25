"use client";

type ExecutionPanelProps = {
  currentStepIndex: number | null;
  totalSteps: number;
  running: boolean;
  completed: number;
  onRunAll: () => void;
  onRunRemaining: () => void;
  hasRemaining: boolean;
  disabled?: boolean;
};

export default function ExecutionPanel({
  currentStepIndex,
  totalSteps,
  running,
  completed,
  onRunAll,
  onRunRemaining,
  hasRemaining,
  disabled
}: ExecutionPanelProps) {
  const progress = totalSteps ? Math.round((completed / totalSteps) * 100) : 0;

  return (
    <section className="rounded-3xl border border-border bg-surface/70 p-6 backdrop-blur-xl shadow-lg transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-muted font-bold">Execution Status</p>
          <p className="mt-1 text-sm font-medium text-text">
            {running && currentStepIndex !== null ? `Step ${currentStepIndex + 1} of ${totalSteps} in progress` : "Idle"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunRemaining}
            disabled={disabled || totalSteps === 0 || !hasRemaining}
            className="rounded-xl border border-border bg-surfaceAlt px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text transition-all hover:border-accent disabled:opacity-50"
          >
            Run Remaining
          </button>
          <button
            type="button"
            onClick={onRunAll}
            disabled={disabled || totalSteps === 0}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-black transition-all hover:brightness-110 disabled:opacity-50 shadow-lg shadow-accent/10 active:scale-95"
          >
            {running ? "Running..." : "Run All Steps"}
          </button>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surfaceAlt/50 border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-700 ease-in-out"
          style={{ width: `${progress}%` }}
          aria-label="Progress"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted">
        <span>{completed} of {totalSteps} tasks completed</span>
        <span className="text-accent">{progress}%</span>
      </div>
    </section>
  );
}


