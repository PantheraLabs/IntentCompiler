# Intent Compiler — Northstar Document

> **The canonical technical reference for the Intent Compiler project.**
> 
> Version: 0.1.0 | Last Updated: March 2026 | Owner: Rishi Praseeth Krishnan

---

## 1. Vision & Purpose

### 1.1 Core Mission
Intent Compiler transforms vague human intent into structured, executable AI workflows. It bridges the gap between natural language desires and precise technical execution plans.

### 1.2 Problem Statement
- **Generic prompts produce generic results**: Users struggle to communicate complex requirements to AI systems
- **Context fragmentation**: Project knowledge exists across multiple files, conversations, and tools
- **Workflow brittleness**: AI-assisted development lacks systematic step-by-step execution with validation
- **Tool lock-in**: Instruction files are platform-specific (Claude, Cursor, Windsurf) with no unified approach

### 1.3 Solution Pillars
1. **Intent Refinement**: LLM-powered analysis converts vague goals into clarified objectives with assumptions
2. **Context Compilation**: Structured context blocks (project, audience, constraints) guide AI behavior
3. **Workflow Generation**: Multi-step execution plans with dependencies, validation, and quality gates
4. **Instruction Export**: Platform-native instruction files (CLAUDE.md, .cursorrules, etc.) from unified source

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTENT COMPILER SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Context    │────▶│  Refinement  │────▶│  Compilation │                │
│  │    Form      │     │    Engine    │     │    Engine    │                │
│  │   (React)    │     │  (LLM calls) │     │              │                │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                │
│         │                                         │                         │
│         ▼                                         ▼                         │
│  ┌──────────────┐                       ┌───────────────────┐              │
│  │  Vibe Mode   │                       │  Workflow Export  │              │
│  │  (Templates) │                       │   (Step-by-step)  │              │
│  └──────────────┘                       └───────────────────┘              │
│                                                     │                       │
│                              ┌────────────────────┼────────────────────┐ │
│                              ▼                    ▼                    ▼ │
│                       ┌──────────┐        ┌──────────┐        ┌──────────┐│
│                       │ Workflow │        │CLAUDE.md │        │.cursorrls││
│                       │Execution │        │AGENTS.md │        │.windsurf ││
│                       │  Page    │        │GEMINI.md │        │   etc    ││
│                       └──────────┘        └──────────┘        └──────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              AI CONTROL CENTER (AICC)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   Groq      │ │ OpenRouter  │ │   Ollama    │ │    OpenAI           │  │
│  │  (Fast)     │ │  (Broad)    │ │ (Private)   │ │   (Fallback)        │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐   │
│  │   SQLite (local) │  │  Session Storage │  │   File System Export    │   │
│  │   (Vibe Library) │  │  (Active Workflow)│  │   (Instruction Files)   │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Architecture Principles
- **Provider Abstraction**: AICC (AI Control Center) unifies Groq, OpenRouter, Ollama, OpenAI under common interface
- **Tier-Based Model Selection**: Automatic model routing (Speed → Efficiency → Quality) based on task complexity
- **Reactive UI**: Framer Motion-powered glassmorphic interface with state-driven animations
- **Zero-Click Context**: Auto-detection of project name, tech stack, and structure

---

## 3. Module Deep Dive

### 3.1 AICC — AI Control Center
**File**: `lib/aicc.ts` (426 lines)

**Responsibilities**:
- Multi-provider authentication and API key management
- Dynamic model discovery and caching (10-min TTL for external, 2-min for Ollama)
- Task-based model selection (complex/structured/simple → optimal model)
- Response normalization (OpenAI, Ollama, OpenRouter → unified format)

**Key Functions**:
```typescript
// Provider management
getAvailableProviders()       // Returns configured providers
getModelsForProvider(p)       // Fetches with caching
hasProviderKey(p)             // Environment variable check

// Model selection
selectModel(taskType, provider?)   // Scores and selects optimal model
resolveModelConfig(config, taskType) // Resolves partial config to full

// Execution
callAICC(messages, config)     // Unified LLM call interface
extractAiccContent(payload)    // Response normalization
```

**Model Selection Scoring**:
- Preference match: +10 (e.g., "claude" in name for complex tasks)
- Family bonus: +5 (Claude, GPT-4), +3 (Llama-3, Gemini)
- Penalties: -5 (tiny models for complex tasks), -3 (oversized for simple)

### 3.2 Context Compiler
**File**: `lib/contextCompiler.ts` (200 lines)

**Responsibilities**:
- Prompt building for each compilation stage
- JSON schema definitions for structured outputs
- Instruction file generation (6 formats: claude/agents/gemini/cursor/windsurf/generic)

**Pipeline Stages**:
```
Raw Intent → Intent Refinement → Structured Context → Behavior Definition → Instruction File
     │              │                    │                  │                  │
     ▼              ▼                    ▼                  ▼                  ▼
  Text        JSON (3 fields)      JSON (4 fields)    JSON (5 fields)     Markdown
```

**Schema Hierarchy**:
- `refinementSchema`: interpreted_intent, assumptions, clarified_goal
- `contextSchema`: project, audience, tech_stack, constraints
- `behaviorSchema`: role, objectives, rules, execution_style, output_format
- `suggestionSchema`: arrays for project, audience, style, tone, constraints

### 3.3 Context Form (UI Controller)
**File**: `components/ContextForm.tsx` (1210 lines)

**Responsibilities**:
- Intent input with real-time suggestion fetching
- Model selection UI with provider/model hierarchy
- View mode switching (Build ↔ Vibe)
- Compilation orchestration (workflow vs. instruction)

**State Management**:
```typescript
intent: string                    // Raw user input
context: UserContext               // Refined context fields
modelConfig: ModelConfig           // Selected provider + model
viewMode: "build" | "vibe"         // UI mode
advancedMode: boolean              // Show/hide advanced options
instructionTarget: InstructionTarget  // Export format selection
```

**Key Interactions**:
1. Intent typing → Debounced (1200ms) → Suggestions API + Model Recommendation API
2. Suggestions returned → Populates SuggestionChips → User can quick-fill
3. Model recommendation → Auto-selects optimal model with reasoning display
4. Compile clicks → POST to `/api/compilation/*` → Route to workflow or stay for preview

### 3.4 Type System
**File**: `lib/types.ts` (173 lines)

**Core Types**:
```typescript
UserContext          // Form input state
WorkflowStep         // Execution unit with rich metadata
Workflow             // Complete executable graph
VibeTemplate         // Pre-configured project templates
Provider             // "groq" | "openrouter" | "ollama" | "openai" | string
ModelConfig          // { provider, model }
IntentRefinement     // { interpreted_intent, assumptions, clarified_goal }
StructuredContext    // { project, audience, tech_stack, constraints }
BehaviorDefinition   // { role, objectives, rules, execution_style, output_format }
```

**WorkflowStep Extended Properties**:
- `stepType`: Categorization (research/write/code/analysis/plan/condition/loop/instruction_*)
- `tool`: Execution mode (llm/shell/http/db/search/file)
- `condition`/`loop`: Flow control structures
- `dependencies`: Step prerequisites for DAG execution
- `quality`: Score and issues for validation
- `logs`: Execution history for debugging

### 3.5 Database Layer
**File**: `lib/db.ts`

**Purpose**: SQLite persistence for Vibe Library (user-created templates)

**Schema**:
```sql
CREATE TABLE vibe_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  context TEXT NOT NULL,  -- JSON serialized
  is_built_in BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API Surface

### 4.1 Compilation Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/compilation/compile` | POST | Generate workflow from intent | `{ workflow, modelConfig }` |
| `/api/compilation/compile-instruction` | POST | Generate instruction file | `{ refinement, structuredContext, behavior, markdown, quality }` |

### 4.2 Suggestion & Analysis

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/suggestions` | POST | Get field suggestions based on intent |
| `/api/recommend-model` | POST | Get optimal model recommendation |
| `/api/model-selection` | GET | List available providers and models |

### 4.3 Execution

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/execution/execute-step` | POST | Execute single workflow step |
| `/api/execution/validate-step` | POST | Validate step output quality |
| `/api/generation/generate-project` | POST | Full project generation from template |

### 4.4 Request/Response Patterns

**Standard Request Structure**:
```typescript
{
  intent: string;
  context: UserContext;
  modelConfig: Partial<ModelConfig>;  // Optional override
}
```

**Quality-Graded Response**:
```typescript
{
  // ... result data ...
  quality?: {
    score: number;           // 0-100 aggregate
    dimensions: {
      correctness: number;
      specificity: number;
      executability: number;
      safety: number;
      compatibility: number;
      brevity: number;
    };
    issues: Array<{
      severity: "high" | "medium" | "low";
      category: "correctness" | ...;
      message: string;
    }>;
  };
  modelConfig: ModelConfig;  // Actual model used
}
```

---

## 5. Data Flows

### 5.1 Workflow Compilation Flow
```
User Intent
    │
    ▼
┌─────────────┐
│ Refinement  │── LLM call (simple tier) ──▶ clarified_goal + assumptions
└─────────────┘
    │
    ▼
┌─────────────┐
│   Context   │── LLM call (structured tier) ──▶ structured context block
│  Building   │
└─────────────┘
    │
    ▼
┌─────────────┐
│ Workflow    │── LLM call (complex tier) ──▶ steps[] with dependencies
│ Generation  │
└─────────────┘
    │
    ▼
Session Storage ──▶ Router push to /workflow
```

### 5.2 Instruction File Compilation Flow
```
User Intent + Target Format (claude/cursor/etc.)
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Refinement  │────▶│   Context   │────▶│  Behavior   │
│   Engine    │     │  Compiler   │     │  Definition │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │ Markdown Renderer│
                                    │ (target-specific│
                                    │   formatting)    │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    Preview + Download
```

### 5.3 Suggestion Flow
```
Intent Input (debounced 1200ms)
    │
    ├──▶ /api/suggestions ──▶ project[], audience[], style[], tone[], constraints[]
    │
    └──▶ /api/recommend-model ──▶ { selectedModel, reasoning }
```

---

## 6. Key Design Decisions

### 6.1 Model Tier Strategy
| Tier | Task Type | Characteristics | Example Models |
|------|-----------|-----------------|----------------|
| **Speed** | Suggestions, simple analysis | Low latency, low cost | llama-3.1-8b, gpt-3.5, gemini-1.5 |
| **Efficiency** | Structured output, JSON | Reliable formatting | gpt-4o, llama-3.1, gemini-flash |
| **Quality** | Complex reasoning, workflows | High capability | claude, gpt-4, llama-3.3, mixtral |

### 6.2 Provider Priority
1. **Groq**: Fastest inference for Llama models
2. **OpenRouter**: Broadest model selection (1000+)
3. **Ollama**: Private, local inference
4. **OpenAI**: Reliable fallback, structured outputs

### 6.3 Caching Strategy
- **Groq models**: 10 minutes (stable model list)
- **OpenRouter models**: 5 minutes (frequent updates)
- **Ollama models**: 2 minutes (local changes)

### 6.4 UI/UX Decisions
- **Glassmorphism**: `backdrop-blur-2xl`, `bg-surface/70` for depth
- **Motion**: Framer Motion with `circOut` easing for premium feel
- **Z-Index Hierarchy**: ContextForm (40) → Dropdowns (50) → Modals (100)
- **Debouncing**: 1200ms for suggestion fetching to reduce API calls

---

## 7. Extension Points

### 7.1 Adding New Providers
1. Add provider name to `Provider` type in `types.ts`
2. Implement `fetch{Provider}Models()` in `aicc.ts`
3. Add auth check in `hasProviderKey()`
4. Add execution branch in `callAICC()`

**Pattern for Generic OpenAI-Compatible Providers**:
```typescript
// Environment variables: {PROVIDER}_API_KEY, {PROVIDER}_BASE_URL (optional)
// Automatic detection via env var pattern matching
```

### 7.2 Adding New Instruction Formats
1. Add target to `InstructionTarget` union type
2. Add filename mapping in `createInstructionMarkdown()`
3. Add format-specific content sections (optional)
4. Add UI option in `instructionTargetOptions`

### 7.3 Adding New Vibe Templates
Templates are defined in `VIBE_GALLERY` array in `ContextForm.tsx`. Each template includes:
- `id`: Unique identifier
- `name`: Display name
- `description`: Short summary
- `context`: Pre-filled UserContext fields

Built-in templates cover:
- Frontend: Shadcn, T3 Stack
- Backend: Python FastAPI
- Enterprise: SaaS, Microservices, Data Engineering
- AI/ML: Agentic AI, MCP Native, Vector RAG
- DevOps: CI/CD, Infrastructure

### 7.4 Custom Workflow Steps
Extend `WorkflowStep` type with new `stepType` values:
- Instruction assembly steps: `instruction_role`, `instruction_context`, `instruction_rules`
- Control flow: `condition`, `loop`
- Tool modes: `shell`, `http`, `db`, `search`, `file`

---

## 8. Environment Configuration

### 8.1 Required Variables
```bash
# At least one provider required
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...

# Optional
OLLAMA_HOST=http://localhost:11434  # Default if unset
```

### 8.2 Custom Provider Pattern
For any OpenAI-compatible endpoint:
```bash
{CUSTOM_NAME}_API_KEY=...
{CUSTOM_NAME}_BASE_URL=https://api.custom.com/v1  # Optional
```

---

## 9. Development Guidelines

### 9.1 Code Conventions
- **TypeScript**: Strict mode enabled, explicit return types on exports
- **React**: Client components marked with `"use client"`, server components default
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Icons**: Lucide React (standard icon library)

### 9.2 Adding API Routes
1. Create `app/api/{feature}/route.ts`
2. Use `NextRequest`/`NextResponse` from `next/server`
3. Call AICC via `callAICC()` with appropriate tier
4. Return structured JSON with `modelConfig` for transparency

### 9.3 Error Handling Pattern
```typescript
try {
  const data = await callAICC(messages, config);
  return NextResponse.json({ result: extractAiccContent(data), modelConfig: resolved });
} catch (err) {
  console.error("[API Error]", err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Unknown error" },
    { status: 500 }
  );
}
```

### 9.4 Testing Strategy
- Unit: Schema validation, utility functions
- Integration: API route handlers with mocked AICC
- E2E: Workflow compilation and execution flows

---

## 10. File Map

```
/app
  /api
    /analysis          → Code/repository analysis endpoints
    /compilation       → Workflow and instruction generation
    /execution         → Step execution engine
    /generate-project  → Full project scaffolding
    /generation        → Text/code generation utilities
    /model-selection   → Provider/model discovery
    /models            → Model metadata
    /recommend-model   → Optimal model selection
    /suggestions       → Context field suggestions
    /validation        → Output quality validation
  /workflow            → Workflow execution page (step-by-step UI)
  page.tsx             → Main landing with ContextForm
  layout.tsx           → Root layout with metadata
  globals.css          → Global styles + CSS variables

/components
  /ui                  → Reusable glassmorphic components
    CompactDropdown.tsx
    SuggestionChips.tsx
  ContextForm.tsx      → Main input interface (1200+ lines)
  ExecutionPanel.tsx   → Workflow step execution UI
  FileTree.tsx         → Project structure visualization
  HistoryPanel.tsx     → Past workflow browser
  ModelRecommendationBadge.tsx
  VibeLibrary.tsx      → Template management modal
  WorkflowContainer.tsx → Step visualization and control

/lib
  /core
    jsonGuard.ts       → JSON parsing safety
    openai.ts          → OpenAI client configuration
    vibeStorage.ts     → Vibe Library CRUD operations
  aicc.ts              → AI Control Center (provider abstraction)
  adaptiveFileGenerator.ts → Smart file content generation
  contextCompiler.ts   → Prompt building and instruction generation
  db.ts                → SQLite database setup
  modelRouter.ts       → Model selection logic
  systemPrompt.ts      → Base system prompt for LLM
  types.ts             → TypeScript type definitions
  utils.ts             → General utilities

/brain                 → Project knowledge and walkthroughs (optional)
```

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **AICC** | AI Control Center — unified interface for multiple LLM providers |
| **Behavior Definition** | Structured AI persona: role, objectives, rules, execution style |
| **Context Refinement** | LLM-based enhancement of vague user intent |
| **Intent** | High-level natural language goal from user |
| **Instruction File** | Platform-specific AI guidance (CLAUDE.md, .cursorrules, etc.) |
| **Provider** | LLM service (Groq, OpenRouter, Ollama, OpenAI) |
| **Step Type** | Categorization of workflow step purpose |
| **Tier** | Quality/speed classification (complex/structured/simple) |
| **Vibe** | Pre-configured project template with preset context |
| **Workflow** | Executable DAG of steps with dependencies |

---

## 12. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-03 | Initial northstar document | Cascade |

---

## 13. References

- [README.md](./README.md) — User-facing documentation
- [LICENSE](./LICENSE) — Restrictive copyright terms
- [package.json](./package.json) — Dependencies and scripts

---

*End of Northstar Document*
