"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface HistoryItem {
  id: string;
  intent: string;
  timestamp: Date;
  provider: string;
  model: string;
  type: "workflow" | "instruction";
}

const mockHistory: HistoryItem[] = [
  {
    id: "1",
    intent: "Build a React weather app with Tailwind",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    provider: "OLLAMA",
    model: "llama3",
    type: "workflow"
  },
  {
    id: "2", 
    intent: "Plan a SaaS onboarding workflow",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    provider: "OPENAI",
    model: "gpt-4o",
    type: "instruction"
  },
  {
    id: "3",
    intent: "Draft a GTM plan for a dev tool",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    provider: "OLLAMA", 
    model: "llama3",
    type: "workflow"
  }
];

export default function HistoryPanel() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-80 flex-shrink-0 rounded-[2.5rem] border border-border bg-surface/70 p-6 shadow-2xl backdrop-blur-2xl h-full overflow-hidden flex flex-col"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-text">
          <span className="bg-gradient-to-br from-accent via-accent to-accent/40 bg-clip-text text-transparent">
            History
          </span>
        </h2>
        <p className="mt-1 text-xs text-muted">Recent compilations and workflows</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
        <AnimatePresence>
          {mockHistory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all overflow-hidden ${
                selectedItem === item.id
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surfaceAlt/50 hover:border-accent/50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === "workflow" ? "bg-emerald-400" : "bg-blue-400"
                  }`} />
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    {item.type}
                  </span>
                </div>
                <span className="text-[10px] text-muted">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-text font-medium mb-2 line-clamp-2">
                {item.intent}
              </p>
              
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <span className="px-2 py-0.5 rounded bg-border/30">
                  {item.provider}
                </span>
                <span className="px-2 py-0.5 rounded bg-border/30">
                  {item.model}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <button className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs font-medium text-text transition hover:border-accent hover:bg-accent/5">
          Clear History
        </button>
      </div>
    </motion.aside>
  );
}
