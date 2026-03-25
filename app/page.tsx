"use client";

import { useState } from "react";
import ContextForm from "@/components/ContextForm";
import WelcomeIntro from "@/components/WelcomeIntro";
import HistoryPanel from "@/components/HistoryPanel";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <main className="min-h-screen px-6 py-12">
      {showIntro && <WelcomeIntro onComplete={() => setShowIntro(false)} />}
      {!showIntro && (
        <div className="flex gap-12 w-full max-w-6xl mx-auto">
          <HistoryPanel />
          <ContextForm />
        </div>
      )}
    </main>
  );
}
