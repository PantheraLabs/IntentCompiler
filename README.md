# Intent Compiler

> **Stop writing prompts. Compile intent into AI systems.**

Intent Compiler is a reactive workflow system that transforms high-level user goals into structured, executable execution plans. It bridges the gap between vague natural language and precise technical instructions, generating everything from step-by-step workflows to industry-standard instruction files like `CLAUDE.md`, `.cursorrules`, and `AGENTS.md`.

## Overview

Complex technical tasks often fail due to poorly defined context, shifting requirements, and generic prompts. Intent Compiler solves this by:
1. **Identifying Intent:** Capturing the core objective of the user.
2. **Refining Context:** Using LLMs to intelligently suggest project types, target audiences, and technical constraints.
3. **Compiling Behavior:** Transforming the refined intent into a structured set of actionable steps or specialized instruction files.

## Features

- **Smart Suggestions:** LLM-powered field recommendations (Project, Audience, Style, Tone) tailored to your specific intent.
- **Reactive Workflows:** A dynamic execution interface where steps can be run, refined, or modified individually.
- **Instruction Generator:** Exports intents into 6+ specialized formats including `CLAUDE.md`, `AGENTS.md`, and `.windsurfrules`.
- **Inspiration Marquee:** An animated, interactive carousel of diverse example intents to jumpstart your workflow.
- **Intelligent Model Orchestration:** A 3-tier model strategy (Quality, Efficiency, Speed) that automatically selects the best LLM (Llama 3.3, Claude 3.5, GPT-4o-mini, etc.) for each sub-task.
- **Dynamic Provider Support:** Real-time fetching and selection of models from Groq and OpenAI.
- **Local LLM Support (Ollama):** High-speed, private inference using models running on your local machine (e.g., Llama 3, Mistral, Phi-3).
- **Vibe Mode:** A dedicated high-fidelity UI view for ultra-fast architectural building.
- **Project Scan Engine:** Automatically detects your project's name and tech stack (Next.js, React, Tailwind, TS) to provide zero-click context.

## Architecture

Intent Compiler is built with a **Fullstack Next.js (App Router)** architecture, emphasizing low latency and high-fidelity UI.

*   **Frontend (React/Framer Motion):** A glassmorphic, reactive interface managed by a central `ContextForm` and `WorkflowContainer`. It uses `framer-motion` for high-end micro-animations and `z-index` layering for perfect UI stacking.
*   **Model Orchestration Layer (`lib/aicc`):** A custom internal abstraction (`AICC`) that manages multi-provider authentication, model property extraction (context length, capabilities), and dynamic tier-based selection.
*   **Compiler Logic (`lib/contextCompiler`):** Implements the logic for building refined prompts, grading result quality, and formatting structured outputs.
*   **API Layer (`app/api`):** Serverless endpoints for real-time suggestion fetching, workflow compilation, and model list synchronization.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI:** [React 19](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **AI Integration:** [OpenAI SDK](https://github.com/openai/openai-node), [Groq API](https://groq.com/)
- **Language:** TypeScript 5.8
- **Formatting:** ESLint

## Repository Structure

```text
/app
  /api              → Serverless LLM endpoints (compile, suggest, execute)
  /workflow         → The interactive workflow execution page
/components
  /ui               → Reusable glassmorphic components (Dropdowns, Chips)
  ContextForm       → Main intent entry & context refinement engine
  WorkflowContainer → Step-by-step execution & result previewer
/lib
  aicc.ts           → Core AI provider & model management (AICC)
  contextCompiler.ts → Logic for structured prompt building & compilation
/brain              → Persistent project knowledge and walkthroughs
```

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/PantheraLabs/IntentCompiler.git
   cd IntentCompiler
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables. Create a `.env` file in the root:
   ```env
   OPENAI_API_KEY=your_openai_key
   GROQ_API_KEY=your_groq_key
   ```
   *(See `.env.example` for all required fields)*

## Usage

### 1. Identify your Intent
Enter a high-level goal in the home screen. Use the **Example Carousel** for inspiration.

### 2. Refine Context
The system will automatically suggest a project type, audience, and constraints. You can use the **Smart Suggestion Chips** to quickly fill out the form.

### 3. Select your Tier
The system automatically optimizes for **Speed** (suggestions), **Efficiency** (refinement), or **Quality** (final compilation). You can manually override models in the dropdowns.

### 4. Compile & Execute
- **Compile Workflow:** Generates a structured execution plan you can run step-by-step.
- **Compile Instruction File:** Generates a high-quality `CLAUDE.md` or `.cursorrules` file based on your intent.

## Development

Run the development server locally:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Linting & Formatting
```bash
npm run lint
```

## Roadmap

- [x] Support for local LLM providers (Ollama).
- [x] Integrate project context auto-detection/scanning.
- [ ] Export workflows directly to JSON/YAML for CLI runners.
- [ ] Multi-turn intent refinement (chat-based context building).
- [ ] Performance benchmarking for different model tiers.

## License

Copyright (c) 2025 Rishi Praseeth Krishnan. All rights reserved.

This software and its source code are for viewing and reference only. No license is granted to use, copy, modify, distribute, or create derivative works without express written permission. See the [LICENSE](file:///c:/Users/rishi/Documents/GitHub/IntentCompiler/LICENSE) file for the full restrictive terms.
