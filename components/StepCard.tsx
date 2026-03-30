"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { WorkflowStep, StepValidation, UserContext } from "@/lib/types";
import type { ToolConfig } from "@/lib/registry";

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
  availableSteps?: WorkflowStep[];
  userContext?: UserContext;
  modelConfig?: { provider: string; model: string };
};

const statusClass: Record<NonNullable<WorkflowStep["status"]>, string> = {
  idle: "border-border bg-surface",
  running: "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]",
  success: "border-emerald-400/40 bg-emerald-400/10",
  error: "border-rose-400/50 bg-rose-400/10"
};

// Output renderer component that handles different formats
function OutputRenderer({ output, format }: { output: string; format: string }) {
  // JSON format
  if (format === "json") {
    return (
      <div className="overflow-x-auto rounded-lg bg-slate-900/50 border border-slate-700/50">
        <pre className="p-4 font-mono text-xs text-cyan-300 leading-relaxed">
          {(() => {
            try {
              return JSON.stringify(JSON.parse(output), null, 2);
            } catch {
              return output;
            }
          })()}
        </pre>
      </div>
    );
  }

  // Plain text format - no markdown parsing
  if (format === "plain") {
    return (
      <div className="whitespace-pre-wrap font-mono text-sm text-text/90 leading-relaxed p-2">
        {output}
      </div>
    );
  }

  // Bullets format - convert • to proper markdown list if needed
  if (format === "bullets") {
    const processedOutput = output
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('•')) {
          return line.replace(/^\s*•\s*/, '- ');
        }
        return line;
      })
      .join('\n');
    
    return (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            ul: ({ children }) => (
              <ul className="space-y-2 my-2">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-2 text-text/90">
                <span className="text-accent mt-1.5">•</span>
                <span className="flex-1">{children}</span>
              </li>
            ),
          }}
        >
          {processedOutput}
        </ReactMarkdown>
      </div>
    );
  }

  // Table format - use markdown table rendering with enhanced styling
  if (format === "table") {
    return (
      <div className="overflow-hidden rounded-lg border border-border/60 bg-surfaceAlt/20">
        <div className="overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <table className="w-full text-sm">{children}</table>
              ),
              thead: ({ children }) => (
                <thead className="bg-surfaceAlt/80 border-b border-border/50">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left font-semibold text-text/90 text-xs uppercase tracking-wider">
                  {children}
                </th>
              ),
              tbody: ({ children }) => <tbody className="divide-y divide-border/30">{children}</tbody>,
              td: ({ children }) => (
                <td className="px-4 py-2.5 text-text/80 text-sm">{children}</td>
              ),
              tr: ({ children }) => <tr className="hover:bg-surfaceAlt/40 transition-colors">{children}</tr>,
            }}
          >
            {output}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Default markdown format with enhanced styling
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-text mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-text/90 mb-2 mt-4 border-b border-border/30 pb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium text-text/85 mb-2 mt-3">{children}</h3>,
          p: ({ children }) => <p className="text-text/80 leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1.5 my-2 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 my-2 ml-4 list-decimal">{children}</ol>,
          li: ({ children }) => (
            <li className="text-text/80 flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          table: ({ children }) => (
            <div className="overflow-hidden rounded-lg border border-border/60 my-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">{children}</table>
              </div>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surfaceAlt/80 border-b border-border/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-text/90 text-xs uppercase tracking-wider">
              {children}
            </th>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border/30">{children}</tbody>,
          td: ({ children }) => <td className="px-4 py-2.5 text-text/80 text-sm">{children}</td>,
          tr: ({ children }) => <tr className="hover:bg-surfaceAlt/40 transition-colors">{children}</tr>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-surfaceAlt/80 text-accent text-xs font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="rounded-lg bg-slate-900/50 p-4 overflow-x-auto text-xs font-mono text-cyan-300 my-3">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/50 pl-4 italic text-text/70 my-3">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
          em: ({ children }) => <em className="italic text-text/90">{children}</em>,
        }}
      >
        {output}
      </ReactMarkdown>
    </div>
  );
}

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
  availableSteps = [],
  userContext,
  modelConfig
}: StepCardProps) {
  const status = step.status ?? "idle";
  const showOutput = status !== "idle" || Boolean(step.output);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "tools" | "conditions" | "dependencies">("basic");
  const [validation, setValidation] = useState<StepValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [originalTask, setOriginalTask] = useState<string>(step.task);

  // Validate step when task changes
  const validateStep = useCallback(async (task: string) => {
    if (!userContext || !task || task.length < 10) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch("/api/validate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: { ...step, task },
          userContext,
          previousSteps: availableSteps.filter(s => s.status === "success"),
          modelConfig
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setValidation(data);
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  }, [step, userContext, availableSteps, modelConfig]);

  // Debounced validation
  useEffect(() => {
    if (step.task !== originalTask && step.task.length > 10) {
      const timer = setTimeout(() => validateStep(step.task), 500);
      return () => clearTimeout(timer);
    }
  }, [step.task, originalTask, validateStep]);

  // Track original task for edit detection
  useEffect(() => {
    if (step.task !== originalTask) {
      setOriginalTask(step.task);
    }
  }, [step.task]);

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
        className={`w-full resize-y rounded-lg border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition ${
          validation && !validation.isValid 
            ? "border-amber-400/50 focus:border-amber-400" 
            : validation && validation.isValid 
            ? "border-emerald-400/50 focus:border-emerald-400"
            : "border-border focus:border-accent"
        }`}
      />
      
      {/* Validation Feedback */}
      {isValidating && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span>Validating...</span>
        </div>
      )}
      
      {validation && !isValidating && (
        <div className={`mt-2 rounded-lg border p-2 text-xs ${
          validation.isValid 
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" 
            : "border-amber-400/30 bg-amber-500/10 text-amber-200"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold uppercase tracking-wider">
              {validation.isValid ? "✓ Valid" : "⚠ Issues Found"}
            </span>
            <span className="text-[10px]">
              Context Score: {Math.round(validation.contextScore * 100)}%
            </span>
          </div>
          
          {validation.warnings.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {validation.warnings.map((warning, idx) => (
                <li key={idx} className="text-[10px]">• {warning}</li>
              ))}
            </ul>
          )}
          
          {validation.suggestions.length > 0 && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold">Suggestions:</p>
              <ul className="mt-0.5 space-y-0.5">
                {validation.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-[10px] opacity-80">• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
              <OutputRenderer output={step.output} format={step.outputFormat || "markdown"} />
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
