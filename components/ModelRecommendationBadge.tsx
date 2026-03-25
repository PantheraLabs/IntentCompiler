"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { ModelRecommendation } from "@/lib/modelRouter";
import type { ModelConfig } from "@/lib/types";

type Props = {
  recommendation: ModelRecommendation | null;
  loading: boolean;
  onApply: (config: ModelConfig) => void;
};

export default function ModelRecommendationBadge({ recommendation, loading, onApply }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const complexityColor: Record<string, string> = {
    simple: "text-sky-400",
    moderate: "text-emerald-400",
    complex: "text-amber-400",
    reasoning: "text-purple-400",
    code: "text-cyan-400"
  };

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-surfaceAlt/30 px-3 py-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-3 w-3 rounded-full border border-accent border-t-transparent"
          />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            Analyzing intent...
          </span>
        </motion.div>
      )}

      {!loading && recommendation && (
        <motion.div
          key="recommendation"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">
                  ⚡ Recommended
                </span>
                {recommendation.isFree ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                    Free
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                    Paid
                  </span>
                )}
                <span className={`text-[9px] uppercase tracking-wider ${complexityColor[recommendation.complexity] ?? "text-muted"}`}>
                  {recommendation.complexity}
                </span>
              </div>

              <p className="mt-1 text-xs font-semibold text-text truncate">
                {recommendation.model.split("/").pop()?.split(":")[0]}
                <span className="ml-1 text-[10px] font-normal text-muted">
                  via {recommendation.provider}
                </span>
              </p>

              <p className="mt-0.5 text-[11px] leading-relaxed text-muted/90">
                {recommendation.reason}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onApply({ provider: recommendation.provider, model: recommendation.model })}
              className="shrink-0 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-500/30"
            >
              Apply
            </button>
          </div>

          {recommendation.alternatives?.length > 0 && (
            <div className="mt-2 border-t border-emerald-500/10 pt-2">
              <button
                type="button"
                onClick={() => setShowAlternatives((p) => !p)}
                className="text-[10px] uppercase tracking-[0.12em] text-muted hover:text-emerald-400 transition-colors"
              >
                {showAlternatives ? "Hide" : "See"} Alternatives ({recommendation.alternatives.length})
              </button>

              <AnimatePresence>
                {showAlternatives && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex flex-col gap-1"
                  >
                    {recommendation.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border/40 bg-surfaceAlt/40 px-3 py-1.5"
                      >
                        <div>
                          <span className="text-[11px] text-text">
                            {alt.model.split("/").pop()?.split(":")[0]}
                          </span>
                          <span className="ml-1.5 text-[10px] text-muted">via {alt.provider}</span>
                          {alt.isFree && (
                            <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 text-[9px] text-emerald-400">
                              Free
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onApply({ provider: alt.provider, model: alt.model })}
                          className="text-[10px] text-muted hover:text-accent transition-colors"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
