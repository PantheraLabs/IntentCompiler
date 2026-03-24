"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ModelConfig, Provider, UserContext, WorkflowStep } from "@/lib/types";

type CompileResponse = {
  steps: WorkflowStep[];
  modelConfig: ModelConfig;
  error?: string;
};

type ModelsResponse = {
  providers: Array<{ provider: Provider; models: string[] }>;
  defaultConfig: ModelConfig;
  error?: string;
};

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
  const [error, setError] = useState("");

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

  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-surface/85 p-6 shadow-card backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Intent Compiler</h1>
          <p className="mt-1 text-sm text-muted">Reactive workflow system for intent-driven execution.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdvancedMode((prev) => !prev)}
          className="rounded-md border border-border bg-surfaceAlt px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-text"
        >
          {advancedMode ? "Advanced On" : "Advanced Off"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">What do you want to do?</label>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={4}
            placeholder="Describe your intent..."
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
          />
          {!intent.trim() ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLE_INTENTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setIntent(example)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
                >
                  {example}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
              <select
                value={modelConfig?.model ?? ""}
                onChange={(e) => setModelConfig((prev) => (prev ? { ...prev, model: e.target.value } : null))}
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              >
                {currentModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {advancedMode ? (
          <div className="grid gap-4 animate-[fadeIn_220ms_ease-out] md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Depth</label>
              <select
                value={context.depth}
                onChange={(e) => setContext((prev) => ({ ...prev, depth: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              >
                <option value="basic">basic</option>
                <option value="detailed">detailed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Style</label>
              <input
                value={context.style}
                onChange={(e) => setContext((prev) => ({ ...prev, style: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Tone</label>
              <input
                value={context.tone}
                onChange={(e) => setContext((prev) => ({ ...prev, tone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Constraints</label>
              <input
                value={constraintsInput}
                onChange={(e) => setConstraintsInput(e.target.value)}
                placeholder="comma,separated,constraints"
                className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="button"
          onClick={onCompile}
          disabled={compiling || !intent.trim() || !modelConfig}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {compiling ? "Compiling..." : "Compile"}
        </button>
      </div>
    </section>
  );
}
