"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { WorkflowStep } from "@/lib/types";
import type { ToolConfig } from "@/lib/tools/registry";

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
  availableSteps?: WorkflowStep[]; // For dependency/condition selection
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
  onCriteriaChange,
  availableSteps = []
}: StepCardProps) {
  const status = step.status ?? "idle";
  const showOutput = status !== "idle" || Boolean(step.output);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "tools" | "conditions" | "dependencies">("basic");

  return (
    <article
      className={`rounded-2xl border p-6 transition-all duration-500 ease-out backdrop-blur-xl shadow-lg ${statusClass[status]} ${
        isCurrent ? "translate-y-[-4px] shadow-xl shadow-accent/5" : "translate-y-0"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Step {index + 1}</p>
            {step.id && (
              <span className="text-[9px] text-muted/50 font-mono">{step.id.slice(0, 8)}...</span>
            )}
          </div>
          <p className="text-sm font-semibold text-text">{step.role}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quality Score Badge */}
          {step.logs && step.logs.length > 0 && step.logs[step.logs.length - 1]?.quality && (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                (step.logs[step.logs.length - 1].quality?.score || 0) >= 85
                  ? "bg-emerald-400/20 text-emerald-300"
                  : (step.logs[step.logs.length - 1].quality?.score || 0) >= 70
                  ? "bg-amber-400/20 text-amber-300"
                  : "bg-rose-400/20 text-rose-300"
              }`}
            >
              Quality: {step.logs[step.logs.length - 1].quality?.score}/100
            </span>
          )}
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
            <option value="instruction_role">Instruction: Role</option>
            <option value="instruction_context">Instruction: Context</option>
            <option value="instruction_rules">Instruction: Rules</option>
            <option value="instruction_assembly">Instruction: Assembly</option>
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

      {/* Advanced Configuration Tabs */}
      <div className="mt-4 border-t border-border/50 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Advanced Configuration</p>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] text-accent hover:text-accent/80 transition"
          >
            {showAdvanced ? "Hide" : "Show"}
          </button>
        </div>
        
        {showAdvanced && (
          <div className="space-y-3">
            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-border/50 pb-2">
              {(["basic", "tools", "dependencies", "conditions"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-[10px] uppercase tracking-[0.12em] rounded-t transition ${
                    activeTab === tab
                      ? "bg-accent/20 text-accent border-b-2 border-accent"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tools Tab */}
            {activeTab === "tools" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Tool Mode</label>
                  <select
                    value={step.tool?.mode || "llm"}
                    onChange={(e) => {
                      const mode = e.target.value as ToolConfig["mode"];
                      onCriteriaChange({
                        tool: {
                          mode,
                          config: mode === "llm" ? {} : { command: "", url: "", query: "", path: "" }
                        } as WorkflowStep["tool"]
                      });
                    }}
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                  >
                    <option value="llm">LLM Only (Default)</option>
                    <option value="shell">Shell Command</option>
                    <option value="http">HTTP Request</option>
                    <option value="search">Web Search</option>
                    <option value="file">File Operation</option>
                  </select>
                </div>

                {step.tool?.mode === "shell" && (
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Command</label>
                    <textarea
                      value={(step.tool.config as { command?: string })?.command || ""}
                      onChange={(e) => onCriteriaChange({
                        tool: { mode: "shell", config: { command: e.target.value } }
                      })}
                      rows={2}
                      placeholder="e.g., npm test"
                      className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent font-mono"
                    />
                  </div>
                )}

                {step.tool?.mode === "http" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Method</label>
                        <select
                          value={(step.tool.config as { method?: string })?.method || "GET"}
                          onChange={(e) => onCriteriaChange({
                            tool: { mode: "http", config: { ...(step.tool?.config || {}), method: e.target.value } }
                          })}
                          className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">URL</label>
                        <input
                          type="text"
                          value={(step.tool.config as { url?: string })?.url || ""}
                          onChange={(e) => onCriteriaChange({
                            tool: { mode: "http", config: { ...(step.tool?.config || {}), url: e.target.value } }
                          })}
                          placeholder="https://api.example.com/data"
                          className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step.tool?.mode === "search" && (
                  <>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Provider</label>
                      <select
                        value={(step.tool.config as { provider?: string })?.provider || "perplexity"}
                        onChange={(e) => onCriteriaChange({
                          tool: { mode: "search", config: { ...(step.tool?.config || {}), provider: e.target.value } }
                        })}
                        className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                      >
                        <option value="perplexity">Perplexity</option>
                        <option value="tavily">Tavily</option>
                        <option value="brave">Brave</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Search Query</label>
                      <input
                        type="text"
                        value={(step.tool.config as { query?: string })?.query || ""}
                        onChange={(e) => onCriteriaChange({
                          tool: { mode: "search", config: { ...(step.tool?.config || {}), query: e.target.value } }
                        })}
                        placeholder="Enter search query"
                        className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                      />
                    </div>
                  </>
                )}

                {step.tool?.mode === "file" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Operation</label>
                        <select
                          value={(step.tool.config as { operation?: string })?.operation || "read"}
                          onChange={(e) => onCriteriaChange({
                            tool: { mode: "file", config: { ...(step.tool?.config || {}), operation: e.target.value } }
                          })}
                          className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                        >
                          <option value="read">Read</option>
                          <option value="write">Write</option>
                          <option value="list">List Directory</option>
                          <option value="search">Search Files</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Path</label>
                        <input
                          type="text"
                          value={(step.tool.config as { path?: string })?.path || ""}
                          onChange={(e) => onCriteriaChange({
                            tool: { mode: "file", config: { ...(step.tool?.config || {}), path: e.target.value } }
                          })}
                          placeholder="./src/file.ts"
                          className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Dependencies Tab */}
            {activeTab === "dependencies" && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted">Select steps that must complete before this step can run:</p>
                {availableSteps
                  .filter((s) => s.id !== step.id)
                  .map((availableStep) => (
                    <label key={availableStep.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={step.dependencies?.includes(availableStep.id!) || false}
                        onChange={(e) => {
                          const currentDeps = step.dependencies || [];
                          const newDeps = e.target.checked
                            ? [...currentDeps, availableStep.id!]
                            : currentDeps.filter((id) => id !== availableStep.id);
                          onCriteriaChange({ dependencies: newDeps });
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-muted">{availableStep.role}</span>
                      <span className="text-[9px] text-muted/50 font-mono">({availableStep.id?.slice(0, 8)}...)</span>
                    </label>
                  ))}
                {availableSteps.filter((s) => s.id !== step.id).length === 0 && (
                  <p className="text-xs text-muted italic">No other steps available for dependency.</p>
                )}
              </div>
            )}

            {/* Conditions Tab */}
            {activeTab === "conditions" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200">
                  <p className="font-semibold">Conditional Branching</p>
                  <p className="text-[10px] mt-1">Define a condition that determines which step runs next.</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">Condition (natural language)</label>
                  <input
                    type="text"
                    value={step.condition?.if || ""}
                    onChange={(e) => onCriteriaChange({
                      condition: e.target.value
                        ? {
                            if: e.target.value,
                            then: step.condition?.then || "",
                            else: step.condition?.else || ""
                          }
                        : undefined
                    })}
                    placeholder="e.g., output contains 'error'"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                  />
                </div>
                {step.condition?.if && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">If True → Go To</label>
                      <select
                        value={step.condition.then}
                        onChange={(e) => onCriteriaChange({
                          condition: { ...step.condition!, then: e.target.value }
                        })}
                        className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                      >
                        <option value="">Select step...</option>
                        {availableSteps
                          .filter((s) => s.id !== step.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.role} ({s.id?.slice(0, 8)}...)</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-muted">If False → Go To</label>
                      <select
                        value={step.condition.else}
                        onChange={(e) => onCriteriaChange({
                          condition: { ...step.condition!, else: e.target.value }
                        })}
                        className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs text-text outline-none transition focus:border-accent"
                      >
                        <option value="">Select step...</option>
                        {availableSteps
                          .filter((s) => s.id !== step.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.role} ({s.id?.slice(0, 8)}...)</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full text-xs border-collapse border border-border/50">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-surfaceAlt/80">{children}</thead>,
                      th: ({ children }) => <th className="border border-border/50 px-3 py-1.5 text-left font-semibold text-text/90 text-[10px] uppercase tracking-wider">{children}</th>,
                      td: ({ children }) => <td className="border border-border/40 px-3 py-1.5 text-muted">{children}</td>,
                      tr: ({ children }) => <tr className="even:bg-surfaceAlt/30">{children}</tr>,
                    }}
                  >{step.output}</ReactMarkdown>
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
