"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import StepCard from "@/components/StepCard";
import ExecutionPanel from "@/components/ExecutionPanel";
import CompactDropdown from "@/components/ui/CompactDropdown";
import type { ModelConfig, UserContext, WorkflowStep } from "@/lib/types";

type WorkflowContainerProps = {
  intent: string;
  context: UserContext;
  initialSteps: WorkflowStep[];
  modelConfig: ModelConfig;
};

type ExecuteResponse = { output?: string; error?: string };
type InstructionTarget = "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
  type InstructionQuality = {
  score: number;
  dimensions: {
    correctness: number;
    specificity: number;
    executability: number;
    safety: number;
    compatibility: number;
    brevity: number;
  };
  issues: Array<{
    severity: "high" | "medium" | "low";
    category: "correctness" | "specificity" | "executability" | "safety" | "compatibility" | "brevity";
    message: string;
  }>;
};
  type GenerateInstructionResponse = {
    markdown?: string;
    originalMarkdown?: string;
    improvedMarkdown?: string;
    quality?: InstructionQuality;
    error?: string;
  };

export default function WorkflowContainer({ intent, context, initialSteps, modelConfig }: WorkflowContainerProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(
    initialSteps.map((step) => ({
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
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(() => steps.filter((step) => step.status === "success").length, [steps]);
  const hasRemaining = useMemo(() => steps.some((step) => step.status !== "success"), [steps]);

  const patchStep = (index: number, patch: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };


  const runStep = async (index: number) => {
    const step = steps[index];
    if (!step) return;

    setError("");
    setCurrentStepIndex(index);
    patchStep(index, { status: "running", error: "" });

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step,
          userContext: context,
          modelConfig,
          previousOutputs: steps.slice(0, index).map((s) => s.output || "").filter(Boolean)
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
      patchStep(index, {
        output: data.output,
        status: "success",
        error: "",
        warnings,
        logs: [...(step.logs ?? []), attemptLog]
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed.";
      patchStep(index, { status: "error", error: message });
      setError(message);
      throw err;
    } finally {
      setCurrentStepIndex(null);
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    setError("");
    for (let i = 0; i < steps.length; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await runStep(i);
      } catch {
        break;
      }
    }
    setRunningAll(false);
  };

  const runRemaining = async () => {
    const startIndex = steps.findIndex((step) => step.status !== "success");
    if (startIndex === -1) return;
    setRunningAll(true);
    setError("");
    for (let i = startIndex; i < steps.length; i += 1) {
      if (steps[i]?.status === "success") continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        await runStep(i);
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
        .map((step, idx) => ({
          ...step,
          id: idx + 1
        }))
    );
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((step, idx) => ({ ...step, id: idx + 1 }));
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
  const [instructionIntent, setInstructionIntent] = useState(intent);
  const [instructionContext, setInstructionContext] = useState({
    project: context.project,
    audience: context.audience,
    style: context.style,
    constraints: context.constraints || []
  });
  const [targetFile, setTargetFile] = useState<InstructionTarget>("claude");
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [generatedQuality, setGeneratedQuality] = useState<InstructionQuality | null>(null);
  const [originalMarkdown, setOriginalMarkdown] = useState("");
  const [improvedMarkdown, setImprovedMarkdown] = useState("");
  const [qualityGate, setQualityGate] = useState(true);
  const [generating, setGenerating] = useState(false);
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
      const res = await fetch("/api/generate-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: instructionIntent,
          context: instructionContext,
          target: targetFile,
          modelConfig,
          enforceQualityGate: qualityGate
        })
      });
      const data = (await res.json()) as GenerateInstructionResponse;
      if (!res.ok || !data.markdown) throw new Error(data.error || "Generation failed.");
      setGeneratedMarkdown(data.markdown);
      setOriginalMarkdown(data.originalMarkdown ?? "");
      setImprovedMarkdown(data.improvedMarkdown ?? "");
      setGeneratedQuality(data.quality ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
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
        <p className="text-lg font-medium text-text leading-relaxed">{intent}</p>
      </section>

      <ExecutionPanel
        running={runningAll || currentStepIndex !== null}
        currentStepIndex={currentStepIndex}
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
            isCurrent={currentStepIndex === index}
            onRun={() => runStep(index)}
            onRerun={() => rerunStep(index)}
            onSkip={() => skipStep(index)}
            onDelete={() => deleteStep(index)}
            onMoveUp={() => moveStep(index, -1)}
            onMoveDown={() => moveStep(index, 1)}
            onTaskChange={(value) => updateTask(index, value)}
            onCriteriaChange={(patch) => updateCriteria(index, patch)}
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
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
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Quality Score</p>
                <p className="mt-1 text-sm font-semibold text-accent">{generatedQuality.score}/100</p>
                <div className="mt-2 grid gap-1 text-[11px] text-muted md:grid-cols-3">
                  <span>Correctness: {generatedQuality.dimensions.correctness.toFixed(1)}/5</span>
                  <span>Specificity: {generatedQuality.dimensions.specificity.toFixed(1)}/5</span>
                  <span>Executability: {generatedQuality.dimensions.executability.toFixed(1)}/5</span>
                  <span>Safety: {generatedQuality.dimensions.safety.toFixed(1)}/5</span>
                  <span>Compatibility: {generatedQuality.dimensions.compatibility.toFixed(1)}/5</span>
                  <span>Brevity: {generatedQuality.dimensions.brevity.toFixed(1)}/5</span>
                </div>
              </div>
            ) : null}
            {originalMarkdown && improvedMarkdown && originalMarkdown !== improvedMarkdown ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-black/20 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Original</p>
                  <div className="prose prose-invert prose-sm max-w-none max-h-[360px] overflow-auto">
                    <ReactMarkdown>{originalMarkdown}</ReactMarkdown>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-emerald-200">Improved</p>
                  <div className="prose prose-invert prose-sm max-w-none max-h-[360px] overflow-auto">
                    <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border bg-black/20 p-5 max-h-[400px] overflow-auto">
                <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

