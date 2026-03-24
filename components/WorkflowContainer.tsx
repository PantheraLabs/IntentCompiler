"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import StepCard from "@/components/StepCard";
import ExecutionPanel from "@/components/ExecutionPanel";
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
type GenerateInstructionResponse = { markdown?: string; quality?: InstructionQuality; error?: string };

export default function WorkflowContainer({ intent, context, initialSteps, modelConfig }: WorkflowContainerProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(
    initialSteps.map((step) => ({ ...step, status: step.status ?? "idle", output: step.output ?? "" }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(() => steps.filter((step) => step.status === "success").length, [steps]);

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

      patchStep(index, { output: data.output, status: "success", error: "" });
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
  const [generating, setGenerating] = useState(false);

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
          modelConfig
        })
      });
      const data = (await res.json()) as GenerateInstructionResponse;
      if (!res.ok || !data.markdown) throw new Error(data.error || "Generation failed.");
      setGeneratedMarkdown(data.markdown);
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
            onDelete={() => deleteStep(index)}
            onMoveUp={() => moveStep(index, -1)}
            onMoveDown={() => moveStep(index, 1)}
            onTaskChange={(value) => updateTask(index, value)}
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
            <select
              className="rounded-lg border border-border bg-surfaceAlt px-3 py-1.5 text-xs text-text outline-none transition focus:border-accent"
              value={targetFile}
              onChange={(e) => setTargetFile(e.target.value as InstructionTarget)}
            >
              <option value="claude">CLAUDE.md</option>
              <option value="agents">AGENTS.md</option>
              <option value="gemini">GEMINI.md</option>
              <option value="cursor">.cursorrules</option>
              <option value="windsurf">.windsurfrules</option>
              <option value="generic">INSTRUCTIONS.md</option>
            </select>
          </div>
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
              </div>
            ) : null}
            <div className="prose prose-invert prose-sm max-w-none rounded-lg border border-border bg-black/20 p-5 max-h-[400px] overflow-auto">
              <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

