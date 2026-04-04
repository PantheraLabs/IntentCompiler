# Project Memory: Intent Compiler

## Project Name
Intent Compiler

## Purpose
Intent Compiler is a universal intent-to-execution layer that transforms high-level user goals into structured, executable execution plans. It bridges the gap between vague natural language and precise technical instructions, generating everything from step-by-step workflows to industry-standard instruction files like `CLAUDE.md`, `.cursorrules`, and `AGENTS.md`.

## Current Status
- **Phase 2 Complete**: Multi-agent orchestration and context engineering are implemented.
- **Next Phase**: Phase 3 - UX & Collaboration (Workflow visualizer, smart suggestions, etc.).

## Tech Stack
- **Framework**: Next.js 15 (App Router), TypeScript 5.8
- **UI**: React 19, Tailwind CSS, Framer Motion, Shadcn/UI
- **AI Integration**: Multi-provider (OpenRouter, Groq, OpenAI, Ollama)
- **Validation**: Zod (runtime validation), AJV (JSON validation)
- **Database**: SQLite (better-sqlite3) for local storage (primary focus is currently session-based for workflows)
- **Export**: jsPDF, JSZip

## Architecture Overview
Intent Compiler follows a 4-phase spec-driven development lifecycle:
1. **SPECIFY**: Raw user intent is refined into a detailed specification.
2. **PLAN**: Specifications are converted into a structured workflow plan with dependencies.
3. **TASKS**: Workflows are broken down into granular tasks for specialized agents.
4. **EXECUTE**: Tasks are executed using engineered context to produce final instructions or code.

## Key Components
- **AICC (AI Control Center)**: Multi-provider abstraction for intelligent model routing.
- **Agent Orchestrator**: Supervisor-led system with specialized agents (Architect, Instructor, Validator, Reviewer, Documenter).
- **Context Engineer**: Intelligent token budget management, prioritization, and compression.
- **Phase Workflow Manager**: Orchestrates the 4-phase execution with user approval checkpoints.

## Data Flow
`User Intent (Raw)` → `Intent Refinement` → `Intent Spec` → `Workflow Plan` → `Orchestration Plan` → `Optimized Context` → `Final Output (Markdown/JSON)`

## Key Decisions
- **Provider Agnostic**: Support for multiple AI providers to avoid vendor lock-in.
- **Tier-Based Model Strategy**: Automatically selects the best model tier (Quality, Efficiency, Speed) for each sub-task.
- **Spec-Driven**: Every workflow must have a validated specification before planning.
- **Vibe System**: Reusable project templates to capture domain-specific best practices.

## Known Issues
- No persistent storage for workflows across sessions (currently in session/memory).
- No built-in authentication or user management (deployment-ready blockers).
- Limited automated testing suite.

## Current Focus
Developing Phase 3 features: Workflow execution visualizer, AI-driven smart suggestions, and real-time collaboration.
