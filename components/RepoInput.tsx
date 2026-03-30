"use client";

import { useState } from "react";

export interface RepoAnalysisResult {
  name: string;
  description: string;
  language: string;
  techStack: string[];
  stars: number;
  hasCI: boolean;
  hasDocker: boolean;
  existingDocs: string[];
  readme: string;
  context: {
    project: string;
    techStack: string;
    audience: string;
    depth: string;
    style: string;
    constraints: string[];
  };
}

type RepoInputProps = {
  onRepoAnalyzed: (result: RepoAnalysisResult) => void;
  onError?: (error: string) => void;
};

export default function RepoInput({ onRepoAnalyzed, onError }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analysis/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze repository");
      }

      // Pass result to parent
      onRepoAnalyzed({
        name: data.repository.name,
        description: data.repository.description,
        language: data.repository.language,
        techStack: data.repository.techStack,
        stars: data.repository.stars,
        hasCI: data.analysis.hasCI,
        hasDocker: data.analysis.hasDocker,
        existingDocs: data.analysis.existingDocs,
        readme: data.readme,
        context: data.context
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to analyze repository";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const isValidGitHubUrl = (url: string) => {
    return url.includes("github.com/") && url.split("/").length >= 5;
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <div className="mb-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Link GitHub Repository
        </label>
        <p className="text-[11px] text-muted mt-1">
          Analyze your repository to auto-populate project context
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent placeholder:text-muted"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => {
            setRepoUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValidGitHubUrl(repoUrl)) {
              handleAnalyze();
            }
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !isValidGitHubUrl(repoUrl)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-rose-400">{error}</p>
      )}

      {repoUrl && isValidGitHubUrl(repoUrl) && !analyzing && (
        <p className="mt-2 text-[10px] text-muted">
          Press Enter or click Analyze to fetch repository details
        </p>
      )}
    </div>
  );
}
