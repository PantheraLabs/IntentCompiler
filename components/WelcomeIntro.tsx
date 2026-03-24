"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface WelcomeIntroProps {
  onComplete: () => void;
}

export default function WelcomeIntro({ onComplete }: WelcomeIntroProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Even slower sequence for better readability
    const timer1 = setTimeout(() => setStep(1), 3000); // 3s for "Intent Compiler"
    const timer2 = setTimeout(() => setStep(2), 7000); // Another 4s for slogan (Total 7s)
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden px-4">
      {/* Background Glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1.5 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
        className="absolute h-[600px] w-[600px] rounded-full bg-accent blur-[140px]"
      />
      
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 15, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(12px)" }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-text">
              <span className="bg-gradient-to-br from-accent via-accent to-accent/40 bg-clip-text text-transparent">
                Intent
              </span> Compiler
            </h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
              className="mx-auto mt-4 h-px bg-accent/30 max-w-[200px]"
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="slogan"
            initial={{ opacity: 0, scale: 1.1, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(12px)" }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="text-center"
          >
            <p className="max-w-3xl text-3xl md:text-5xl font-extralight leading-tight tracking-tight text-text/90">
              Reactive workflow system for <br />
              <span className="font-normal text-accent italic">intent-driven</span> execution.
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-6 text-center"
          >
            <motion.div
              animate={{ 
                boxShadow: ["0 0 20px rgba(var(--accent-rgb), 0)", "0 0 40px rgba(var(--accent-rgb), 0.3)", "0 0 20px rgba(var(--accent-rgb), 0)"] 
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-surface/50 p-10 backdrop-blur-2xl shadow-2xl"
            >
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-text">Ready to build?</h2>
              <p className="mb-10 text-lg leading-relaxed text-muted">
                Transpile your intents into actionable <br /> high-fidelity workflows.
              </p>
              
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05, filter: "brightness(1.1)", boxShadow: "0 0 30px rgba(var(--accent-rgb), 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onComplete}
                  className="group relative flex items-center justify-center gap-3 rounded-full bg-accent px-10 py-5 text-xl font-bold text-black transition-all"
                >
                  Get Started
                  <svg className="h-6 w-6 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
