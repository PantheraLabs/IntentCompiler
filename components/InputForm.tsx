"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CompactDropdown from "@/components/ui/CompactDropdown";
import TierBadge from "@/components/TierBadge";
import type { UserContext, WorkflowStep } from "@/lib/types";
import type { UserTier } from "@/lib/tierConfig";

type CompileResponse = {
  steps: WorkflowStep[];
  error?: string;
};

const initialContext: UserContext = {
  project: "",
  audience: "",
  depth: "basic",
  style: "",
  constraints: [],
  userTier: "free"
};

export default function InputForm() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [context, setContext] = useState<UserContext>(initialContext);
  const [constraintsInput, setConstraintsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTierInfo, setShowTierInfo] = useState(false);

  const handleCompile = async () => {
    setLoading(true);
    setError("");

    const constraints = constraintsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      intent,
      context: { ...context, constraints }
    };

    try {
      const res = await fetch("/api/compilation/compile", {
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
          steps: data.steps
        })
      );

      router.push("/workflow");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = intent.trim().length > 0 && !loading;

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface/80 p-6 shadow-card backdrop-blur">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Intent Compiler</h1>
          <p className="mt-1 text-sm text-muted">Convert intent + context into executable AI workflows.</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTierInfo(!showTierInfo)}
            className="cursor-pointer"
          >
            <TierBadge tier={context.userTier || "free"} showDetails={showTierInfo} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">What do you want to do?</label>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={4}
            placeholder="e.g. Validate a startup idea"
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Project Name</label>
            <input
              value={context.project}
              onChange={(e) => setContext((prev) => ({ ...prev, project: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Audience</label>
            <input
              value={context.audience}
              onChange={(e) => setContext((prev) => ({ ...prev, audience: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Depth</label>
            <CompactDropdown
              value={context.depth}
              onChange={(value) => setContext((prev) => ({ ...prev, depth: value }))}
              options={[
                { value: "basic", label: "Basic" },
                { value: "detailed", label: "Detailed" }
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Style</label>
            <input
              value={context.style}
              onChange={(e) => setContext((prev) => ({ ...prev, style: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">User Tier</label>
            <CompactDropdown
              value={context.userTier || "free"}
              onChange={(value) => setContext((prev) => ({ ...prev, userTier: value as UserTier }))}
              options={[
                { value: "free", label: "Free (8 steps max)" },
                { value: "premium", label: "Premium (Unlimited)" }
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Tech Stack (optional)</label>
            <input
              value={context.techStack || ""}
              onChange={(e) => setContext((prev) => ({ ...prev, techStack: e.target.value }))}
              placeholder="React, Node.js, PostgreSQL"
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted">Constraints (comma-separated)</label>
          <input
            value={constraintsInput}
            onChange={(e) => setConstraintsInput(e.target.value)}
            placeholder="budget limit, no paid ads, 2-week timeline"
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={handleCompile}
          disabled={!canSubmit}
          className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Compiling..." : "Compile"}
        </button>
      </div>
    </div>
  );
}
