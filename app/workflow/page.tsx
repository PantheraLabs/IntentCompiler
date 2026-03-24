"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkflowContainer from "@/components/WorkflowContainer";
import type { StoredWorkflow } from "@/lib/types";

export default function WorkflowPage() {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<StoredWorkflow | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("intentCompilerWorkflow");
    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredWorkflow;
      if (!parsed?.steps?.length || !parsed.modelConfig) {
        router.push("/");
        return;
      }
      setWorkflow(parsed);
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!workflow) {
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
      <WorkflowContainer
        intent={workflow.intent}
        context={workflow.context}
        initialSteps={workflow.steps}
        modelConfig={workflow.modelConfig}
      />
    </main>
  );
}
