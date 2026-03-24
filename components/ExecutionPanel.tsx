"use client";

type ExecutionPanelProps = {
  currentStepIndex: number | null;
  totalSteps: number;
  running: boolean;
  completed: number;
  onRunAll: () => void;
  disabled?: boolean;
};

export default function ExecutionPanel({
  currentStepIndex,
  totalSteps,
  running,
  completed,
  onRunAll,
  disabled
}: ExecutionPanelProps) {
  const progress = totalSteps ? Math.round((completed / totalSteps) * 100) : 0;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">Execution</p>
          <p className="text-sm text-text">
            {running && currentStepIndex !== null ? `Running step ${currentStepIndex + 1}/${totalSteps}` : "Idle"}
          </p>
        </div>
        <button
          type="button"
          onClick={onRunAll}
          disabled={disabled || totalSteps === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {running ? "Running..." : "Run All"}
        </button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surfaceAlt">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-label="Progress"
        />
      </div>
      <p className="mt-2 text-xs text-muted">{completed} completed | {progress}%</p>
    </section>
  );
}


