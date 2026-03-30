"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsPDF } from "jspdf";
import StepCard from "@/components/StepCard";
import ExecutionPanel from "@/components/ExecutionPanel";
import CompactDropdown from "@/components/ui/CompactDropdown";
import FileTree from "@/components/FileTree";
import RepoInput from "@/components/RepoInput";
import { resolveExecutionOrder, createExecutionContext, type ExecutionContext } from "@/lib/executionEngine";
import { downloadAllAsZip } from "@/lib/fileExporter";
import type { ModelConfig, UserContext, WorkflowStep, Workflow } from "@/lib/types";

type WorkflowContainerProps = {
  workflow?: Workflow;
  intent?: string;
  context?: UserContext;
  initialSteps?: WorkflowStep[];
  modelConfig: ModelConfig;
};

type ExecuteResponse = { 
  output?: string; 
  error?: string;
  warnings?: string[];
  attempts?: number;
  quality?: { score: number; issues: number };
};
type InstructionTarget = "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
type InstructionQuality = {
  score: number;
  issues: string[];
  suggestions: string[];
};
export default function WorkflowContainer({ workflow, intent: propIntent, context: propContext, initialSteps, modelConfig }: WorkflowContainerProps) {
  // Support both new workflow format and legacy props
  const resolvedIntent = workflow?.intent || propIntent || "";
  const resolvedContext = workflow?.context || propContext || { project: "", audience: "", depth: "basic", style: "", constraints: [] };
  const resolvedSteps = workflow?.steps || initialSteps || [];
  
  const [steps, setSteps] = useState<WorkflowStep[]>(
    resolvedSteps.map((step) => ({
      ...step,
      status: step.status ?? "idle",
      output: step.output ?? "",
      stepType: step.stepType ?? "analysis",
      outputFormat: step.outputFormat ?? "markdown",
      mustInclude: step.mustInclude ?? [],
      mustAvoid: step.mustAvoid ?? [],
      acceptanceTests: step.acceptanceTests ?? [],
      qualityBar: step.qualityBar ?? "",
      warnings: step.warnings ?? []
    }))
  );
  const [executionContext, setExecutionContext] = useState<ExecutionContext | null>(
    workflow ? createExecutionContext(workflow) : null
  );
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [stepOutputs, setStepOutputs] = useState<Map<string, string>>(new Map());
  const [runningAll, setRunningAll] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(() => steps.filter((step) => step.status === "success").length, [steps]);
  const hasRemaining = useMemo(() => steps.some((step) => step.status !== "success"), [steps]);

  const patchStep = (index: number, patch: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };


  const runStep = async (index: number, currentStepOutputs?: Map<string, string>) => {
    const step = steps[index];
    if (!step) return;

    setError("");
    setCurrentStepId(step.id);
    patchStep(index, { status: "running", error: "" });

    // Build outputs from completed steps if not provided
    const outputsToUse = currentStepOutputs || (() => {
      const map = new Map<string, string>();
      steps.forEach(s => {
        if (s.status === "success" && s.output) {
          map.set(s.id, s.output);
        }
      });
      return map;
    })();

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step,
          userContext: resolvedContext,
          modelConfig,
          previousOutputs: steps.slice(0, index).map((s) => s.output || "").filter(Boolean),
          stepOutputs: Object.fromEntries(outputsToUse)
        })
      });

      const data = (await res.json()) as ExecuteResponse;
      if (!res.ok || !data.output) {
        throw new Error(data.error || "Execution failed.");
      }

      const warnings = data.warnings ?? [];
      const attemptLog = {
        attempt: data.attempts ?? 1,
        output: data.output,
        warnings,
        timestamp: new Date().toISOString()
      };
      
      // Update stepOutputs for dependency tracking
      const updatedStepOutputs = new Map(outputsToUse);
      updatedStepOutputs.set(step.id, data.output || "");
      setStepOutputs(updatedStepOutputs);
      
      // Update execution context to reflect completed step
      setExecutionContext(prev => {
        if (!prev || !workflow) return prev;
        const newContext = { ...prev };
        newContext.completedSteps.add(step.id);
        newContext.stepOutputs.set(step.id, data.output || "");
        newContext.executionPath.push(step.id);
        return newContext;
      });
      
      patchStep(index, {
        output: data.output,
        status: "success",
        error: "",
        warnings,
        logs: [...(step.logs ?? []), attemptLog]
      });
      
      return updatedStepOutputs;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed.";
      patchStep(index, { status: "error", error: message });
      setError(message);
      throw err;
    } finally {
      setCurrentStepId(null);
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    setError("");
    
    // Get execution order based on dependencies
    const executionOrder = workflow ? resolveExecutionOrder(workflow, executionContext || undefined) : [];
    
    let accumulatedOutputs = new Map(stepOutputs); // Start with current state
    
    for (const stepId of executionOrder) {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) continue;
      
      // Skip if already successful
      if (steps[stepIndex]?.status === "success") {
        continue;
      }
      
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await runStep(stepIndex, accumulatedOutputs);
        if (result) {
          accumulatedOutputs = result;
        }
      } catch {
        break;
      }
    }
    setRunningAll(false);
  };

  const runRemaining = async () => {
    setRunningAll(true);
    setError("");
    
    // Build stepOutputs from completed steps
    let accumulatedOutputs = new Map<string, string>();
    steps.forEach(step => {
      if (step.status === "success" && step.output) {
        accumulatedOutputs.set(step.id, step.output);
      }
    });
    
    const startIndex = steps.findIndex((step) => step.status !== "success");
    if (startIndex === -1) {
      setRunningAll(false);
      return;
    }
    
    for (let i = startIndex; i < steps.length; i += 1) {
      if (steps[i]?.status === "success") continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await runStep(i, accumulatedOutputs);
        if (result) {
          accumulatedOutputs = result;
        }
      } catch {
        break;
      }
    }
    setRunningAll(false);
  };

  const deleteStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((step) => ({
          ...step
        }))
    );
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((step) => ({ ...step }));
    });
  };

  const updateTask = (index: number, task: string) => patchStep(index, { task, status: "idle" });
  const updateCriteria = (index: number, patch: Partial<WorkflowStep>) =>
    patchStep(index, { ...patch, status: "idle" });

  const skipStep = (index: number) => {
    patchStep(index, { status: "success", output: "[skipped]" });
  };

  const rerunStep = (index: number) => {
    patchStep(index, { status: "idle", output: "", error: "", warnings: [] });
    runStep(index);
  };

  // Instruction Generator State
  const [instructionIntent, setInstructionIntent] = useState(resolvedIntent);
  const [instructionContext, setInstructionContext] = useState({
    project: resolvedContext.project,
    audience: resolvedContext.audience,
    style: resolvedContext.style,
    constraints: resolvedContext.constraints || []
  });
  const [targetFile, setTargetFile] = useState<InstructionTarget>("claude");
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [generatedQuality, setGeneratedQuality] = useState<InstructionQuality | null>(null);
  const [originalMarkdown] = useState("");
  const [improvedMarkdown] = useState("");
  const [qualityGate, setQualityGate] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [livePreview, setLivePreview] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);
  // Multi-file state
  const [generatedFiles, setGeneratedFiles] = useState<Array<{
    name: string;
    type: string;
    content: string;
    quality: number;
    dependencies: string[];
  }>>([]);
  const [isMultiFile, setIsMultiFile] = useState(false);
  const [projectAnalysis, setProjectAnalysis] = useState<{
    type: string;
    complexity: string;
    reasoning: string;
  } | null>(null);
  const formatOptions: Array<{ value: InstructionTarget; label: string }> = [
    { value: "claude", label: "CLAUDE.md" },
    { value: "agents", label: "AGENTS.md" },
    { value: "gemini", label: "GEMINI.md" },
    { value: "cursor", label: ".cursorrules" },
    { value: "windsurf", label: ".windsurfrules" },
    { value: "generic", label: "INSTRUCTIONS.md" }
  ];

  const generateInstruction = async () => {
    setGenerating(true);
    try {
      // Use the new adaptive project generation API
      const res = await fetch("/api/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: steps,
          context: resolvedContext,
          intent: instructionIntent || resolvedIntent,
          target: targetFile,
          enhanceWithSkillLibrary: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data.files || data.files.length === 0) {
        throw new Error(data.error || "Generation failed.");
      }
      
      // Store multi-file output
      setGeneratedFiles(data.files);
      setIsMultiFile(data.isMultiFile);
      setProjectAnalysis({
        type: data.analysis.type,
        complexity: data.analysis.complexity,
        reasoning: data.analysis.reasoning
      });
      
      // For backward compatibility, set the first file as the main markdown
      setGeneratedMarkdown(data.files[0].content);
      setGeneratedQuality({
        score: data.totalQuality,
        issues: [],
        suggestions: data.analysis.reasoning ? [data.analysis.reasoning] : []
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  // Generate live preview from completed steps
  const generateLivePreview = () => {
    const completedSteps = steps.filter(s => s.status === "success" && s.output);
    if (completedSteps.length === 0) {
      setLivePreview("");
      return;
    }

    const preview = `# ${targetFile.toUpperCase()} - AI Instruction File

> Generated by IntentCompiler
> Project: ${resolvedContext.project || "Not specified"}
> Generated: ${new Date().toLocaleString()}

---

## Overview

${resolvedIntent}

---

${completedSteps.map(step => `## ${step.sectionName || step.role}

${step.output}`).join("\n\n---\n\n")}

---

## Usage

This instruction file is designed for use with ${targetFile === "claude" ? "Claude AI" : targetFile === "cursor" ? "Cursor IDE" : targetFile === "windsurf" ? "Windsurf IDE" : "AI assistants"}.

### Integration Steps:
1. Save this file as \`${targetFile === "cursor" ? ".cursorrules" : targetFile === "windsurf" ? ".windsurfrules" : targetFile.toUpperCase() + ".md"}\` in your project root
2. The AI assistant will automatically read these instructions
3. Customize as needed for your specific workflow

---

*Generated with IntentCompiler - Transform your intent into structured AI instructions*
`;

    setLivePreview(preview);
    setShowLivePreview(true);
  };

  const downloadMD = () => {
    const blob = new Blob([generatedMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetFile.toUpperCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(generatedMarkdown, 180);
    doc.text(splitText, 15, 15);
    doc.save(`${targetFile.toUpperCase()}.pdf`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-20 px-4">
      <section className="rounded-3xl border border-border bg-surface/70 p-8 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-[0.15em] text-muted font-bold">Original Intent</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {modelConfig.provider}:{modelConfig.model}
          </span>
        </div>
        <p className="text-lg font-medium text-text leading-relaxed">{resolvedIntent}</p>
      </section>

      <ExecutionPanel
        running={runningAll || currentStepId !== null}
        currentStepIndex={currentStepId ? steps.findIndex(s => s.id === currentStepId) : null}
        totalSteps={steps.length}
        completed={completedCount}
        onRunAll={runAll}
        onRunRemaining={runRemaining}
        hasRemaining={hasRemaining}
        disabled={steps.length === 0}
      />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="grid gap-4">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            isCurrent={currentStepId === step.id}
            onRun={() => runStep(index)}
            onRerun={() => rerunStep(index)}
            onSkip={() => skipStep(index)}
            onDelete={() => deleteStep(index)}
            onMoveUp={() => moveStep(index, -1)}
            onMoveDown={() => moveStep(index, 1)}
            onTaskChange={(value) => updateTask(index, value)}
            onCriteriaChange={(patch) => updateCriteria(index, patch)}
            availableSteps={steps}
            userContext={resolvedContext}
            modelConfig={modelConfig}
          />
        ))}
      </div>

      {/* Instruction Generator Card */}
      <section className="mt-12 rounded-[2.5rem] border border-border bg-surface/70 p-10 shadow-2xl backdrop-blur-2xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 className="text-2xl font-bold text-text">
            <span className="bg-gradient-to-br from-accent via-accent to-accent/40 bg-clip-text text-transparent">
              Instruction
            </span> Generator
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Format</span>
            <div className="w-44 relative z-10">
              <CompactDropdown
              value={targetFile}
                onChange={setTargetFile}
                options={formatOptions}
                buttonClassName="py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surfaceAlt/40 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Quality Gate</span>
          <button
            type="button"
            onClick={() => setQualityGate((prev) => !prev)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
              qualityGate
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                : "border-border text-muted"
            }`}
          >
            {qualityGate ? "On" : "Off"}
          </button>
          <span className="text-[10px] text-muted">
            When on, auto‑improve low scores before showing output.
          </span>
        </div>

        {/* Live Preview Section */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Live Preview</p>
              <p className="text-[10px] text-muted mt-0.5">Preview instruction file from completed steps</p>
            </div>
            <button
              type="button"
              onClick={generateLivePreview}
              disabled={completedCount === 0}
              className="rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs text-accent transition hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showLivePreview ? "Refresh Preview" : "Generate Preview"}
            </button>
          </div>
          
          {showLivePreview && livePreview && (
            <div className="mt-3 rounded-lg border border-border bg-black/20 p-4 max-h-[400px] overflow-auto">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{livePreview}</ReactMarkdown>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(livePreview);
                  }}
                  className="rounded-md border border-border bg-surfaceAlt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent transition hover:border-accent"
                >
                  Copy Preview
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([livePreview], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${targetFile.toUpperCase()}_preview.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-md border border-border bg-surfaceAlt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text transition hover:border-accent"
                >
                  Download Preview
                </button>
              </div>
            </div>
          )}
          
          {completedCount === 0 && (
            <p className="text-[10px] text-muted italic">Complete at least one step to generate a preview</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {/* Repository Input */}
            <RepoInput
              onRepoAnalyzed={(result) => {
                // Auto-populate context from repository analysis
                setInstructionIntent(prev => prev || `Generate instruction files for ${result.name}`);
                setInstructionContext({
                  project: result.name,
                  audience: "developers",
                  style: "technical",
                  constraints: result.existingDocs.length > 0 
                    ? [`Existing docs: ${result.existingDocs.join(", ")}`]
                    : []
                });
              }}
            />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Refined Intent</label>
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-border bg-surfaceAlt p-3 text-sm text-text outline-none transition focus:border-accent"
                placeholder="What should this instruction file achieve?"
                value={instructionIntent}
                onChange={(e) => setInstructionIntent(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Tone & Style</label>
              <input
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                placeholder="Professional, technical, etc."
                value={instructionContext.style}
                onChange={(e) => setInstructionContext({ ...instructionContext, style: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Constraints</label>
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-border bg-surfaceAlt p-3 text-sm text-text outline-none transition focus:border-accent"
                placeholder="Strict rules for the AI (one per line)"
                value={instructionContext.constraints.join("\n")}
                onChange={(e) => setInstructionContext({ 
                  ...instructionContext, 
                  constraints: e.target.value.split("\n").filter(c => c.trim() !== "") 
                })}
              />
            </div>

            <button
              onClick={generateInstruction}
              disabled={generating || !instructionIntent.trim()}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-black shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Instructions"}
            </button>
          </div>
        </div>

        {generatedMarkdown && (
          <div className="mt-8 border-t border-border pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Project Analysis Info */}
            {projectAnalysis && (
              <div className="mb-4 rounded-lg border border-border bg-surfaceAlt/50 px-4 py-3">
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 font-medium text-accent capitalize">
                    {projectAnalysis.type}
                  </span>
                  <span className="rounded-full bg-muted/20 px-2 py-0.5 font-medium text-muted capitalize">
                    {projectAnalysis.complexity}
                  </span>
                  {isMultiFile && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
                      {generatedFiles.length} files
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted">{projectAnalysis.reasoning}</p>
              </div>
            )}
            
            {/* Multi-file view */}
            {isMultiFile && generatedFiles.length > 1 ? (
              <FileTree
                files={generatedFiles}
                isMultiFile={true}
                onDownloadAll={() => downloadAllAsZip(generatedFiles, resolvedContext.project || "project")}
                onCopyFile={(file) => navigator.clipboard.writeText(file.content)}
              />
            ) : (
              /* Single file view */
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Preview & Export</p>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadMD}
                      className="rounded-md border border-border bg-surfaceAlt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text transition hover:border-accent"
                    >
                      Download .MD
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="rounded-md border border-border bg-surfaceAlt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text transition hover:border-accent"
                    >
                      Download .PDF
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMarkdown);
                      }}
                      className="rounded-md border border-border bg-surfaceAlt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent transition hover:border-accent"
                    >
                      Copy
                    </button>
                  </div>
                </div>
            {generatedQuality ? (
              <div className="mb-4 rounded-lg border border-accent/40 bg-accent/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Quality Score</p>
                  <p className={`text-sm font-semibold ${generatedQuality.score >= 90 ? "text-emerald-400" : generatedQuality.score >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                    {generatedQuality.score}/100
                    {generatedQuality.score >= 90 && " ✓ Threshold Met"}
                  </p>
                </div>
                {generatedQuality.issues.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted">Issues ({generatedQuality.issues.length})</p>
                    <ul className="mt-1 space-y-0.5 text-[10px] text-amber-200">
                      {generatedQuality.issues.slice(0, 3).map((issue, idx) => (
                        <li key={idx}>• {issue}</li>
                      ))}
                      {generatedQuality.issues.length > 3 && (
                        <li className="text-muted">...and {generatedQuality.issues.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {generatedQuality.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted">Suggestions</p>
                    <ul className="mt-1 space-y-0.5 text-[10px] text-text/70">
                      {generatedQuality.suggestions.slice(0, 2).map((suggestion, idx) => (
                        <li key={idx}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
            {originalMarkdown && improvedMarkdown && originalMarkdown !== improvedMarkdown ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-black/20 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Original</p>
                  <div className="prose prose-invert prose-sm max-w-none max-h-[360px] overflow-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{originalMarkdown}</ReactMarkdown>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-emerald-200">Improved</p>
                  <div className="prose prose-invert prose-sm max-w-none max-h-[360px] overflow-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedMarkdown}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border bg-black/20 p-5 max-h-[400px] overflow-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedMarkdown}</ReactMarkdown>
              </div>
            )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

