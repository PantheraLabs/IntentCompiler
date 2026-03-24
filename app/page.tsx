"use client";

import { useState } from "react";
import ContextForm from "@/components/ContextForm";
import WelcomeIntro from "@/components/WelcomeIntro";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <main className="min-h-screen px-4 py-12 md:px-6">
      {showIntro && <WelcomeIntro onComplete={() => setShowIntro(false)} />}
      {!showIntro && <ContextForm />}
    </main>
  );
}
