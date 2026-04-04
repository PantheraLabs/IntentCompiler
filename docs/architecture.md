# System Architecture: Intent Compiler

## Overview
Intent Compiler is designed as a modular, reactive system for distilling human intent into machine-executable actions. The architecture separates UI reactivity from complex AI orchestration and context management.

## Modules and Responsibilities

### 1. Frontend Layer (`/app`, `/components`)
- **App Router**: Manages page navigation and API routes.
- **ContextForm**: The entry point for heart-of-intent capture and refinement.
- **WorkflowContainer**: Orchestrates the visual feedback of the 4-phase workflow.
- **Framer Motion Integration**: Provides high-fidelity animations for state transitions.

### 2. Model Orchestration Layer (`lib/aicc.ts`, `lib/modelRouter.ts`)
- **AICC (AI Control Center)**: A unified wrapper for OpenAI, OpenRouter, Groq, and Ollama.
- **Tier Selection**: Logic to route tasks to models based on required reasoning depth vs. speed.
- **Capability Scoring**: Dynamic assessment of model features (tool use, JSON mode, context length).

### 3. Agent Orchestration (`lib/agentOrchestrator.ts`)
- **Supervisor Pattern**: A central coordinator manages specialized sub-agents.
- **Specialized Agents**:
  - **Architect**: Designs the graph of steps.
  - **Instructor**: Crafts the final output content.
  - **Validator**: Ensures outputs match schemas.
  - **Reviewer**: Identifies optimization points.
- **Execution Strategies**: Supports sequential, parallel, and hybrid execution of tasks.

### 4. Context Engineering (`lib/contextEngineer.ts`)
- **Token Budgeting**: Allocates tokens between system prompt, user context, and history.
- **Prioritization**: Ranks context items by relevance to the specific task.
- **Compression**: Truncates and compresses low-priority context to fit model windows.

### 5. Workflow Execution (`lib/phaseWorkflow.ts`, `lib/executionEngine.ts`)
- **Phase Management**: Strict state machine for Specify → Plan → Tasks → Execute.
- **Validation Checkpoints**: Zod-based gates at every phase transition.
- **Rollback Logic**: Ability to revert to a previous phase for correction.

## Folder Structure Explanation
- `/app/api`: Serverless endpoints for AI services and repository analysis.
- `/components/ui`: Glassmorphic, reusable atom components.
- `/lib/core`: Low-level utilities (JSON guards, base AI logic).
- `/lib/schemas.ts`: Central source of truth for all project data types.

## Component Interaction
1. `ContextForm` sends intent to `/api/compilation`.
2. `PhaseWorkflowManager` starts the `SPECIFY` phase.
3. `AgentOrchestrator` delegates refinement to a specialized agent.
4. Output is validated against `IntentSpecSchema`.
5. User approves, and the system proceeds to `PLAN` phase.
