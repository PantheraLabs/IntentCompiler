"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type {
  BehaviorDefinition,
  IntentRefinement,
  ModelConfig,
  Provider,
  StructuredContext,
  UserContext,
  WorkflowStep
} from "@/lib/types";

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // circOut approx
      staggerChildren: 0.12
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 90, damping: 14 }
  }
};

const buttonVariants: Variants = {
  hover: { 
    scale: 1.04, 
    filter: "brightness(1.15)",
    boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.25)",
    transition: { type: "spring", stiffness: 400, damping: 12 } 
  },
  tap: { scale: 0.96 }
};

type CompileResponse = {
  steps: WorkflowStep[];
  modelConfig: ModelConfig;
  error?: string;
};

type CompileInstructionResponse = {
  refinement: IntentRefinement;
  structuredContext: StructuredContext;
  behavior: BehaviorDefinition;
  markdown: string;
  quality?: {
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
  modelConfig: ModelConfig;
  error?: string;
};

type ModelsResponse = {
  providers: Array<{ provider: Provider; models: string[] }>;
  defaultConfig: ModelConfig;
  error?: string;
};

type InstructionTarget = "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
type ModelViewMode = "recommended" | "all" | "legacy";

const EXAMPLE_INTENTS = [
  "Validate a startup idea",
  "Draft a go-to-market plan for a developer tool",
  "Plan onboarding workflow for a SaaS app"
];

const initialContext: UserContext = {
  project: "",
  audience: "",
  depth: "basic",
  style: "",
  tone: "",
  constraints: []
};

function isLegacyModel(model: string) {
  return /preview|gpt-3\.5|0613|1106|0125|0314|0301|32k|instruct|vision-preview/i.test(model);
}

function isRecommendedModel(model: string) {
  return /gpt-4\.1|gpt-4o|llama-3\.3|llama-3\.1|claude-3\.5|claude-4|gemini-2|mixtral|qwen|grok/i.test(model);
}

function formatModelLabel(model: string) {
  return model
    .replaceAll("/", " / ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getModelFamily(model: string) {
  const normalized = model.toLowerCase();
  if (normalized.includes("gpt-4.1")) return "GPT 4.1";
  if (normalized.includes("gpt-4o")) return "GPT 4o";
  if (normalized.includes("gpt-4")) return "GPT 4";
  if (normalized.includes("gpt-3.5")) return "GPT 3.5";
  if (normalized.includes("claude")) return "Claude";
  if (normalized.includes("llama")) return "Llama";
  if (normalized.includes("mixtral")) return "Mixtral";
  if (normalized.includes("gemini")) return "Gemini";
  if (normalized.includes("qwen")) return "Qwen";
  if (normalized.includes("grok")) return "Grok";
  return "Other";
}

export default function ContextForm() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [context, setContext] = useState<UserContext>(initialContext);
  const [constraintsInput, setConstraintsInput] = useState("");
  const [models, setModels] = useState<Array<{ provider: Provider; models: string[] }>>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [compilingInstruction, setCompilingInstruction] = useState(false);
  const [target, setTarget] = useState<InstructionTarget>("claude");
  const [instructionResult, setInstructionResult] = useState<CompileInstructionResponse | null>(null);
  const [error, setError] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelView, setModelView] = useState<ModelViewMode>("recommended");
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models");
        const data = (await res.json()) as ModelsResponse;
        if (!res.ok || !data.providers?.length) {
          throw new Error(data.error || "No models available.");
        }
        setModels(data.providers);
        setModelConfig(data.defaultConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load models.");
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  const currentModels = useMemo(() => {
    if (!modelConfig) return [];
    return models.find((entry) => entry.provider === modelConfig.provider)?.models ?? [];
  }, [models, modelConfig]);

  const filteredModels = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();
    return currentModels.filter((model) => {
      const legacy = isLegacyModel(model);
      const includeByMode =
        modelView === "all" || (modelView === "legacy" ? legacy : isRecommendedModel(model) && !legacy);
      if (!includeByMode) return false;
      if (!search) return true;
      return model.toLowerCase().includes(search) || formatModelLabel(model).toLowerCase().includes(search);
    });
  }, [currentModels, modelSearch, modelView]);

  const groupedFilteredModels = useMemo(() => {
    const groups = new Map<string, string[]>();
    filteredModels.forEach((model) => {
      const family = getModelFamily(model);
      groups.set(family, [...(groups.get(family) || []), model]);
    });
    return Array.from(groups.entries());
  }, [filteredModels]);

  useEffect(() => {
    if (!modelPickerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!modelPickerRef.current?.contains(event.target as Node)) {
        setModelPickerOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModelPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modelPickerOpen]);

  const onCompile = async () => {
    if (!intent.trim() || !modelConfig) return;

    setCompiling(true);
    setError("");

    try {
      const constraints = constraintsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        intent,
        context: { ...context, constraints },
        modelConfig
      };

      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as CompileResponse;
      if (!res.ok || !data.steps?.length) {
        throw new Error(data.error || "Compilation failed.");
      }

      sessionStorage.setItem(
        "intentCompilerWorkflow",
        JSON.stringify({
          intent,
          context: payload.context,
          modelConfig: data.modelConfig,
          steps: data.steps
        })
      );

      router.push("/workflow");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed.");
    } finally {
      setCompiling(false);
    }
  };

  const onCompileInstruction = async () => {
    if (!intent.trim() || !modelConfig) return;
    setCompilingInstruction(true);
    setError("");
    setInstructionResult(null);

    try {
      const constraints = constraintsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        intent,
        context: { ...context, constraints },
        target,
        modelConfig
      };

      const res = await fetch("/api/compile-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as CompileInstructionResponse;
      if (!res.ok || !data.markdown) {
        throw new Error(data.error || "Instruction compilation failed.");
      }
      setInstructionResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Instruction compilation failed.");
    } finally {
      setCompilingInstruction(false);
    }
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto w-full max-w-4xl rounded-[2.5rem] border border-border bg-surface/70 p-10 shadow-2xl backdrop-blur-2xl"
    >
      <motion.div variants={itemVariants} className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">
            <span className="bg-gradient-to-br from-accent via-accent to-accent/40 bg-clip-text text-transparent">
              Intent
            </span> Compiler
          </h1>
          <p className="mt-1.5 text-sm text-muted">Reactive workflow system for intent-driven execution.</p>
        </div>
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          type="button"
          onClick={() => setAdvancedMode((prev) => !prev)}
          className="rounded-md border border-border bg-surfaceAlt px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-text transition-colors hover:border-accent"
        >
          {advancedMode ? "Advanced On" : "Advanced Off"}
        </motion.button>
      </motion.div>

      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">What do you want to do?</label>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={4}
            placeholder="Describe your intent..."
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20"
          />
          <AnimatePresence>
            {!intent.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 flex flex-wrap gap-2 overflow-hidden"
              >
                {EXAMPLE_INTENTS.map((example) => (
                  <motion.button
                    key={example}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    type="button"
                    onClick={() => setIntent(example)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    {example}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Provider</label>
            {loadingModels ? (
              <div className="h-10 animate-pulse rounded-lg border border-border bg-surfaceAlt" />
            ) : (
              <select
                value={modelConfig?.provider ?? ""}
                onChange={(e) => {
                  const provider = e.target.value as Provider;
                  const providerModels = models.find((entry) => entry.provider === provider)?.models ?? [];
                  setModelConfig({ provider, model: providerModels[0] ?? "" });
                  setModelSearch("");
                  setModelView("recommended");
                  setModelPickerOpen(false);
                }}
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              >
                {models.map((entry) => (
                  <option key={entry.provider} value={entry.provider}>
                    {entry.provider}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Model</label>
            {loadingModels ? (
              <div className="h-10 animate-pulse rounded-lg border border-border bg-surfaceAlt" />
            ) : (
              <div ref={modelPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setModelPickerOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-left text-sm text-text outline-none transition hover:border-accent focus:border-accent"
                >
                  <span className="truncate">{modelConfig?.model ?? "Select model"}</span>
                  <span className="ml-2 text-xs text-muted">{modelPickerOpen ? "^" : "v"}</span>
                </button>

                <AnimatePresence>
                  {modelPickerOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute z-40 mt-2 w-full rounded-xl border border-border bg-[#08101b] p-3 shadow-2xl"
                    >
                      <input
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        autoComplete="off"
                        spellCheck={false}
                        name="model_search"
                        className="mb-2 w-full rounded-md border border-border bg-surfaceAlt px-2.5 py-2 text-xs text-text outline-none transition focus:border-accent"
                      />

                      <div className="mb-2 flex gap-1.5">
                        {(["recommended", "all", "legacy"] as ModelViewMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setModelView(mode)}
                            className={`rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.12em] transition ${
                              modelView === mode
                                ? "border border-accent bg-accent/15 text-accent"
                                : "border border-border text-muted hover:border-accent/40 hover:text-text"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {groupedFilteredModels.length ? (
                          groupedFilteredModels.map(([family, familyModels]) => (
                            <div key={family}>
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{family}</p>
                              <div className="space-y-1">
                                {familyModels.map((model) => (
                                  <button
                                    key={model}
                                    type="button"
                                    onClick={() => {
                                      setModelConfig((prev) => (prev ? { ...prev, model } : null));
                                      setModelPickerOpen(false);
                                    }}
                                    className={`w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                                      modelConfig?.model === model
                                        ? "border-accent bg-accent/15 text-accent"
                                        : "border-border text-text hover:border-accent/50"
                                    }`}
                                  >
                                    <p className="truncate font-medium">{formatModelLabel(model)}</p>
                                    <p className="truncate text-[10px] text-muted">{model}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-md border border-border px-2 py-4 text-center text-xs text-muted">
                            No models match this filter.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted font-bold">Instruction Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as InstructionTarget)}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            >
              <option value="claude">CLAUDE.md</option>
              <option value="agents">AGENTS.md</option>
              <option value="gemini">GEMINI.md</option>
              <option value="cursor">.cursorrules</option>
              <option value="windsurf">.windsurfrules</option>
              <option value="generic">INSTRUCTIONS.md</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Project</label>
            <input
              value={context.project}
              onChange={(e) => setContext((prev) => ({ ...prev, project: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Audience</label>
            <input
              value={context.audience}
              onChange={(e) => setContext((prev) => ({ ...prev, audience: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {advancedMode && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0, height: 0, overflow: "hidden" },
                visible: {
                  opacity: 1,
                  height: "auto",
                  transition: { 
                    duration: 0.4, 
                    ease: [0.23, 1, 0.32, 1],
                    staggerChildren: 0.08 
                  },
                  transitionEnd: { overflow: "visible" }
                }
              }}
              className="overflow-visible"
              onAnimationComplete={() => {
                // Ensure it's visible after animation to prevent clipping of absolute children
              }}
            >
              <div className="grid gap-4 pt-2 md:grid-cols-3">
                <motion.div variants={itemVariants}>
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Depth</label>
                  <select
                    value={context.depth}
                    onChange={(e) => setContext((prev) => ({ ...prev, depth: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em] bg-no-repeat pr-10"
                  >
                    <option value="basic">basic</option>
                    <option value="detailed">detailed</option>
                  </select>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Style</label>
                  <input
                    value={context.style}
                    onChange={(e) => setContext((prev) => ({ ...prev, style: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Tone</label>
                  <input
                    value={context.tone}
                    onChange={(e) => setContext((prev) => ({ ...prev, tone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="md:col-span-3">
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Constraints</label>
                  <input
                    value={constraintsInput}
                    onChange={(e) => setConstraintsInput(e.target.value)}
                    placeholder="comma,separated,constraints"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={onCompile}
            disabled={compiling || !intent.trim() || !modelConfig}
            className="group relative flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
          >
            {compiling ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-4 w-4 border-2 border-black border-t-transparent rounded-full"
                />
                Compiling...
              </span>
            ) : (
              "Compile Workflow"
            )}
            <motion.div
              className="absolute inset-0 rounded-md bg-accent opacity-0 blur-lg transition-opacity group-hover:opacity-40"
              initial={false}
            />
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={onCompileInstruction}
            disabled={compilingInstruction || !intent.trim() || !modelConfig}
            className="rounded-md border border-border bg-surfaceAlt px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-50"
          >
            {compilingInstruction ? "Compiling Instruction..." : "Compile Instruction File"}
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {compilingInstruction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-5 grid gap-3"
          >
            <div className="h-16 animate-pulse rounded-lg border border-border bg-surfaceAlt/50" />
            <div className="h-16 animate-pulse rounded-lg border border-border bg-surfaceAlt/50" />
            <div className="h-24 animate-pulse rounded-lg border border-border bg-surfaceAlt/50" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {instructionResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="rounded-lg border border-border bg-surfaceAlt/70 p-4 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Intent Refinement</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{JSON.stringify(instructionResult.refinement, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-border bg-surfaceAlt/70 p-4 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Context Builder</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{JSON.stringify(instructionResult.structuredContext, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-border bg-surfaceAlt/70 p-4 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Behavior Compiler</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{JSON.stringify(instructionResult.behavior, null, 2)}</pre>
            </div>
            {instructionResult.quality ? (
              <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Quality Report</p>
                  <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    Score: {instructionResult.quality.score}/100
                  </span>
                </div>
                <div className="grid gap-2 text-xs text-text md:grid-cols-3">
                  <p>Correctness: {instructionResult.quality.dimensions.correctness.toFixed(1)}/5</p>
                  <p>Specificity: {instructionResult.quality.dimensions.specificity.toFixed(1)}/5</p>
                  <p>Executability: {instructionResult.quality.dimensions.executability.toFixed(1)}/5</p>
                  <p>Safety: {instructionResult.quality.dimensions.safety.toFixed(1)}/5</p>
                  <p>Compatibility: {instructionResult.quality.dimensions.compatibility.toFixed(1)}/5</p>
                  <p>Brevity: {instructionResult.quality.dimensions.brevity.toFixed(1)}/5</p>
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted">Issues</p>
                  {instructionResult.quality.issues.length ? (
                    <ul className="space-y-1 text-xs text-text">
                      {instructionResult.quality.issues.slice(0, 8).map((issue, idx) => (
                        <li key={`${issue.category}-${idx}`} className="rounded border border-border/70 bg-black/20 px-2 py-1">
                          <span className="mr-1 font-semibold uppercase text-muted">[{issue.severity}]</span>
                          <span className="mr-1 text-muted">({issue.category})</span>
                          <span>{issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-300">No issues found. File passed all current checks.</p>
                  )}
                </div>
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-black/30 p-4 shadow-inner">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Instruction File</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{instructionResult.markdown}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
