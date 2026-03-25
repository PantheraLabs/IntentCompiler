"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

type CompactDropdownProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Array<DropdownOption<T>>;
  placeholder?: string;
  disabled?: boolean;
  buttonClassName?: string;
  menuClassName?: string;
};

export default function CompactDropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled = false,
  buttonClassName = "",
  menuClassName = ""
}: CompactDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${open ? "z-[60]" : "z-0"}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-left text-sm text-text outline-none transition hover:border-accent focus:border-accent disabled:opacity-60 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <span className="ml-2 text-xs text-muted">{open ? "^" : "v"}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute z-50 mt-2 w-full rounded-xl border border-border bg-[#08101b] p-2 shadow-2xl ${menuClassName}`}
          >
            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                    option.value === value
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-text hover:border-accent/50"
                  }`}
                >
                  <p className="truncate font-medium">{option.label}</p>
                  {option.hint ? <p className="truncate text-[10px] text-muted">{option.hint}</p> : null}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
