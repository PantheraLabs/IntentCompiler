"use client";

import { motion } from "framer-motion";

type SuggestionChipsProps = {
  suggestions: string[];
  onSelect: (value: string) => void;
  className?: string;
};

export default function SuggestionChips({ suggestions, onSelect, className = "" }: SuggestionChipsProps) {
  return (
    <div className={`mt-2 flex flex-wrap gap-2 ${className}`}>
      {suggestions.map((suggestion) => (
        <motion.button
          key={suggestion}
          type="button"
          whileHover={{ scale: 1.05, backgroundColor: "rgba(var(--accent-rgb), 0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
