"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkflowContainer from "@/components/WorkflowContainer";
import type { StoredWorkflow, Workflow, ModelConfig } from "@/lib/types";

export default function WorkflowPage() {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [legacyWorkflow, setLegacyWorkflow] = useState<StoredWorkflow | null>(null);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("intentCompilerWorkflow");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      
      // Check if it's the new workflow format
      if (parsed?.workflow?.id && parsed?.workflow?.steps) {
        setWorkflow(parsed.workflow as Workflow);
        setModelConfig(parsed.modelConfig as ModelConfig);
        setLegacyWorkflow(null);
      } 
      // Check legacy format
      else if (parsed?.steps?.length && parsed.modelConfig) {
        setLegacyWorkflow(parsed as StoredWorkflow);
        setWorkflow(null);
        setModelConfig(null);
      } else {
        router.push("/");
        return;
      }
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!workflow && !legacyWorkflow) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-6xl animate-pulse space-y-4">
          <div className="h-24 rounded-xl border border-border bg-surface" />
          <div className="h-28 rounded-xl border border-border bg-surface" />
          <div className="h-56 rounded-xl border border-border bg-surface" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      {workflow && modelConfig ? (
        <WorkflowContainer
          workflow={workflow}
          modelConfig={modelConfig}
        />
      ) : legacyWorkflow ? (
        <WorkflowContainer
          intent={legacyWorkflow.intent}
          context={legacyWorkflow.context}
          initialSteps={legacyWorkflow.steps}
          modelConfig={legacyWorkflow.modelConfig}
        />
      ) : null}
    </main>
  );
}
