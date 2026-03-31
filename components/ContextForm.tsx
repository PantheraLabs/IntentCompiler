"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import CompactDropdown from "@/components/ui/CompactDropdown";
import SuggestionChips from "@/components/ui/SuggestionChips";
import ModelRecommendationBadge from "@/components/ModelRecommendationBadge";
import VibeLibrary from "@/components/VibeLibrary";
import IntelligentQuestionsModal from "@/components/IntelligentQuestionsModal";
import { isFreeModel, type ModelRecommendation } from "@/lib/modelRouter";
import type {
  BehaviorDefinition,
  IntentRefinement,
  ModelConfig,
  Provider,
  StructuredContext,
  UserContext,
  VibeTemplate,
  WorkflowStep
} from "@/lib/types";
import type { Question } from "@/lib/intelligentQuestioner";

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // circOut approx
      staggerChildren: 0.12
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 90, damping: 14 }
  }
};

const buttonVariants: Variants = {
  hover: { 
    scale: 1.04, 
    filter: "brightness(1.15)",
    boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.25)",
    transition: { type: "spring", stiffness: 400, damping: 12 } 
  },
  tap: { scale: 0.96 }
};

type CompileResponse = {
  workflow?: { id: string; steps: WorkflowStep[] };
  steps?: WorkflowStep[];
  modelConfig: ModelConfig;
  error?: string;
};

type CompileInstructionResponse = {
  refinement: IntentRefinement;
  structuredContext: StructuredContext;
  behavior: BehaviorDefinition;
  markdown: string;
  quality?: {
    score: number;
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
      category: "correctness" | "specificity" | "executability" | "safety" | "compatibility" | "brevity";
      message: string;
    }>;
  };
  modelConfig: ModelConfig;
  error?: string;
};

type ModelsResponse = {
  providers: Array<{ provider: Provider; models: string[] }>;
  defaultConfig: ModelConfig;
  error?: string;
};

type InstructionTarget = "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
type ModelViewMode = "recommended" | "all" | "legacy" | "free";

const EXAMPLE_INTENTS = [
  "Build a React weather app with Tailwind",
  "Plan a SaaS onboarding workflow",
  "Draft a GTM plan for a dev tool",
  "Design a neo-minimalist landing page",
  "Implement a TTT mechanism with LoRA",
  "Create a Python script for web scraping",
  "Architect a serverless backend on AWS",
  "Write a technical doc for a REST API",
  "Validate a high-frequency trading idea",
  "Optimize PostgreSQL query performance",
  "Build an AI-powered code reviewer",
  "Design a dark-mode dashboard for CRM",
  "Implement JWT auth in a Next.js app",
  "Create a CI/CD pipeline with GitHub Actions",
  "Develop a cross-platform mobile app in Flutter"
];

function MarqueeCarousel({ items, onSelect }: { items: string[], onSelect: (val: string) => void }) {
  return (
    <div className="relative flex w-full overflow-hidden py-2 select-none pointer-events-auto">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          duration: 30,
          ease: "linear",
          repeatType: "loop"
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        whileHover={{ animationPlayState: "paused" } as any}
        className="flex shrink-0 gap-4"
      >
        {[...items, ...items].map((item, idx) => (
          <button
            key={`${item}-${idx}`}
            onClick={() => onSelect(item)}
            className="whitespace-nowrap rounded-full border border-border bg-surfaceAlt/50 px-4 py-1.5 text-xs text-muted transition-all hover:border-accent hover:text-accent hover:bg-accent/5"
          >
            {item}
          </button>
        ))}
      </motion.div>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
    </div>
  );
}

const initialContext: UserContext = {
  project: "",
  audience: "",
  depth: "basic",
  style: "",
  tone: "",
  constraints: []
};

const FIELD_SUGGESTIONS = {
  project: ["Web App", "Mobile App", "Python Script", "CLI Tool", "Documentation"],
  audience: ["Developers", "PMs", "Investors", "End Users", "Designers"],
  style: ["Concise", "Detailed", "Technical", "Professional", "Creative"],
  tone: ["Neutral", "Authoritative", "Friendly", "Direct", "Academic"],
  constraints: ["No External Deps", "Include Tests", "Strict Types", "Use Tailwind", "Performance First"]
};

const PRESETS: Array<{ label: string; value: string; context: Partial<UserContext> }> = [
  { 
    label: "Fullstack App", 
    value: "fullstack", 
    context: { project: "Next.js Fullstack App", audience: "Developers", style: "Detailed", tone: "Technical" } 
  },
  { 
    label: "Python Script", 
    value: "python", 
    context: { project: "Python Automation Script", audience: "Developers", style: "Concise", tone: "Direct" } 
  },
  { 
    label: "Technical Doc", 
    value: "doc", 
    context: { project: "Project Documentation", audience: "PMs & Stakeholders", style: "Professional", tone: "Formal" } 
  }
];

function isLegacyModel(model: string) {
  return /preview|gpt-3\.5|0613|1106|0125|0314|0301|32k|instruct|vision-preview/i.test(model);
}

function isRecommendedModel(model: string) {
  return /gpt-4\.1|gpt-4o|llama-3\.3|llama-3\.1|claude-3\.5|claude-4|gemini-2|mixtral|qwen|grok|phi|gemma|mistral|deepseek/i.test(
    model
  );
}


function formatModelLabel(model: string) {
  return model
    .replaceAll("/", " / ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getModelFamily(model: string) {
  const normalized = model.toLowerCase();
  if (normalized.includes("gpt-4.1")) return "GPT 4.1";
  if (normalized.includes("gpt-4o")) return "GPT 4o";
  if (normalized.includes("gpt-4")) return "GPT 4";
  if (normalized.includes("gpt-3.5")) return "GPT 3.5";
  if (normalized.includes("claude")) return "Claude";
  if (normalized.includes("llama")) return "Llama";
  if (normalized.includes("mixtral")) return "Mixtral";
  if (normalized.includes("gemini")) return "Gemini";
  if (normalized.includes("qwen")) return "Qwen";
  if (normalized.includes("grok")) return "Grok";
  if (normalized.includes("phi")) return "Phi";
  if (normalized.includes("gemma")) return "Gemma";
  if (normalized.includes("mistral")) return "Mistral";
  if (normalized.includes("deepseek")) return "DeepSeek";
  if (normalized.includes("openrouter")) return "OpenRouter";
  return "Other";
}

const VIBE_GALLERY: VibeTemplate[] = [
  {
    id: "shadcn-vibe",
    name: "Shadcn Vibe",
    description: "Modern, clean, and interactive",
    context: { project: "Next.js App", audience: "Frontend Devs", tech_stack: "Next.js 15, Tailwind CSS, Shadcn/UI, Lucide", style: "Neon Minimalist", constraints: ["Strict TypeScript", "Accessibility First"] }
  },
  {
    id: "python-fastapi",
    name: "Python FastVibe",
    description: "FastAPI + Pydantic performance",
    context: { project: "Python Backend", audience: "Data Engineers", tech_stack: "FastAPI, Pydantic v2, PostgreSQL, Redis", style: "Concise & Scalable", constraints: ["Async First", "Type Hinting"] }
  },
  {
    id: "t3-stack",
    name: "The T3 Vibe",
    description: "Type-safe fullstack speed",
    context: { project: "T3 Stack App", audience: "Fullstack Teams", tech_stack: "Next.js, tRPC, Prisma, Tailwind", style: "Safety First", constraints: ["Zod Validation", "End-to-end Types"] }
  },
  // Enterprise / Professional Vibes
  {
    id: "enterprise-saas",
    name: "Enterprise SaaS",
    description: "Multi-tenant SaaS with RBAC, billing, and audit logging",
    context: { project: "B2B SaaS Platform", audience: "Enterprise Clients", tech_stack: "Next.js, PostgreSQL, Stripe, Clerk, Redis, BullMQ", style: "Enterprise Grade", constraints: ["Multi-tenancy", "RBAC", "Audit Logging", "GDPR Compliance"] }
  },
  {
    id: "event-driven-microservices",
    name: "Event-Driven Microservices",
    description: "Async event streaming with message brokers and CQRS",
    context: { project: "Distributed System", audience: "Platform Engineers", tech_stack: "Node.js, Kafka/RabbitMQ, PostgreSQL, Redis, Docker, Kubernetes", style: "Event-Driven Architecture", constraints: ["Eventual Consistency", "Idempotency", "Saga Pattern", "Circuit Breakers"] }
  },
  {
    id: "data-engineering",
    name: "Data Engineering Pipeline",
    description: "ETL/ELT pipelines with real-time streaming",
    context: { project: "Data Platform", audience: "Data Engineers", tech_stack: "Apache Kafka, Airflow, dbt, Snowflake/BigQuery, Python, pandas", style: "Production Data Pipelines", constraints: ["Data Quality Checks", "Schema Evolution", "Partitioning Strategy", "Monitoring & Alerting"] }
  },
  {
    id: "devops-platform",
    name: "DevOps Platform",
    description: "CI/CD automation with IaC and observability",
    context: { project: "DevOps Platform", audience: "DevOps Engineers", tech_stack: "GitHub Actions, Terraform, AWS/GCP, Docker, Kubernetes, Prometheus, Grafana", style: "Infrastructure as Code", constraints: ["GitOps", "Immutable Infrastructure", "Zero-Downtime Deploy", "Cost Optimization"] }
  },
  {
    id: "ai-ml-engineering",
    name: "AI/ML Engineering",
    description: "MLOps pipeline with model serving and feature stores",
    context: { project: "ML Platform", audience: "ML Engineers", tech_stack: "Python, PyTorch/TensorFlow, MLflow, Kubeflow, Feast, FastAPI, Ray", style: "Production ML Systems", constraints: ["Model Versioning", "A/B Testing", "Feature Store", "Drift Detection"] }
  },
  {
    id: "api-gateway",
    name: "API Gateway Platform",
    description: "BFF pattern with rate limiting and auth",
    context: { project: "API Platform", audience: "API Consumers", tech_stack: "Kong/AWS API Gateway, Node.js/Go, Redis, JWT/OAuth2, OpenAPI", style: "API-First Design", constraints: ["Rate Limiting", "Request Validation", "Schema Registry", "Backward Compatibility"] }
  },
  {
    id: "real-time-streaming",
    name: "Real-Time Streaming",
    description: "WebSocket/WebRTC apps with low-latency requirements",
    context: { project: "Streaming Platform", audience: "Real-time Users", tech_stack: "Node.js, Socket.io/WebRTC, Redis Pub/Sub, TimescaleDB, Grafana", style: "Low Latency Systems", constraints: ["Sub-100ms Latency", "Horizontal Scaling", "Graceful Degradation", "Connection Resilience"] }
  },
  {
    id: "fintech-platform",
    name: "FinTech Platform",
    description: "Financial systems with ACID compliance and security",
    context: { project: "Financial Platform", audience: "Financial Institutions", tech_stack: "Java/Go, PostgreSQL, Kafka, Redis, Vault, Kubernetes", style: "Banking Grade Security", constraints: ["ACID Transactions", "PCI-DSS Compliance", "Idempotency Keys", "Audit Trails"] }
  },
  {
    id: "ecommerce-engine",
    name: "E-commerce Engine",
    description: "High-volume commerce with inventory and payments",
    context: { project: "E-commerce Platform", audience: "Online Retailers", tech_stack: "Next.js, Node.js, PostgreSQL, Redis, Stripe, Elasticsearch, AWS S3", style: "Commerce Scale", constraints: ["Inventory Consistency", "Payment Idempotency", "Cart Abandonment", "Fraud Detection"] }
  },
  // 2026 Cutting-Edge Vibes
  {
    id: "agentic-ai",
    name: "Agentic AI System",
    description: "Multi-agent orchestration with reasoning and tool use",
    context: { project: "AI Agent Platform", audience: "AI Engineers", tech_stack: "LangChain/LangGraph, OpenAI/Anthropic, Python, Redis, FastAPI, Vector DB", style: "Agent-Native Architecture", constraints: ["Tool Use Validation", "Agent State Management", "Human-in-the-Loop", "Cost Controls"] }
  },
  {
    id: "mcp-native",
    name: "MCP Native App",
    description: "Model Context Protocol with resource servers and tools",
    context: { project: "MCP Application", audience: "AI-First Developers", tech_stack: "TypeScript, MCP SDK, SSE/Stdio transports, Zod schemas, Claude API", style: "Context-Rich AI", constraints: ["MCP Protocol Compliance", "Resource Pagination", "Tool Descriptions", "Error Recovery"] }
  },
  {
    id: "llm-native-backend",
    name: "LLM-Native Backend",
    description: "Streaming AI responses with structured generation",
    context: { project: "AI Backend", audience: "AI Product Teams", tech_stack: "Node.js/Python, OpenAI/Anthropic/Groq, Zod, Server-Sent Events, Upstash", style: "Streaming-First", constraints: ["Structured Outputs", "Streaming JSON", "Token Limits", "Retry Logic"] }
  },
  {
    id: "vector-rag",
    name: "Vector RAG Pipeline",
    description: "Embedding-based retrieval with hybrid search",
    context: { project: "RAG Platform", audience: "ML Engineers", tech_stack: "Pinecone/Weaviate, OpenAI Embeddings, LangChain, PostgreSQL, pgvector", style: "Retrieval-Augmented", constraints: ["Chunking Strategy", "Re-ranking", "Context Window", "Embedding Caching"] }
  },
  {
    id: "autonomous-dev",
    name: "Autonomous Dev Agent",
    description: "Self-directed coding with planning and execution",
    context: { project: "Coding Agent", audience: "Developer Tools", tech_stack: "Claude Code, Aider, GitHub API, Docker, Sandboxed Execution, Tree-sitter", style: "Autonomous Coding", constraints: ["Sandbox Security", "Git Integration", "Test Validation", "Rollback Capability"] }
  }
];

export default function ContextForm() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [viewMode, setViewMode] = useState<"build" | "vibe">("build");
  const [context, setContext] = useState<UserContext>(initialContext);
  const [constraintsInput, setConstraintsInput] = useState("");
  const [models, setModels] = useState<Array<{ provider: Provider; models: string[] }>>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [recommendation, setRecommendation] = useState<ModelRecommendation | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [autoSelectedModel, setAutoSelectedModel] = useState<boolean>(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  
  // INTELLIGENT QUESTIONING STATES
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Auto-scan project on mount
  useEffect(() => {
    async function scan() {
      try {
        const res = await fetch("/api/analysis/scan-project");
        if (res.ok) {
          const data = await res.json();
          setContext((prev) => ({
            ...prev,
            project: data.name || prev.project,
            tech_stack: data.techStack || prev.techStack
          }));
        }
      } catch (err) {
        console.error("Project scan failed:", err);
      }
    }
    scan();
  }, []);

  // Debounced model recommendation — fires when intent is at least 8 chars
  useEffect(() => {
    if (intent.trim().length < 8) {
      setRecommendation(null);
      return;
    }
    setLoadingRecommendation(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/recommend-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent })
        });
        if (res.ok) {
          const rec = await res.json();
          setRecommendation(rec);
        } else {
          console.error("Recommend API error:", res.status, res.statusText);
          const errorText = await res.text();
          console.error("Error response:", errorText);
        }
      } catch {
        // silently fail — just don't show a recommendation
      } finally {
        setLoadingRecommendation(false);
      }
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [intent]);

  const [compiling, setCompiling] = useState(false);
  const [compilingInstruction, setCompilingInstruction] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(FIELD_SUGGESTIONS);
  const [target, setTarget] = useState<InstructionTarget>("claude");
  const [instructionResult, setInstructionResult] = useState<CompileInstructionResponse | null>(null);
  const [error, setError] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelView, setModelView] = useState<ModelViewMode>("recommended");
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Models API error:", res.status, errorText);
          throw new Error(`Models API failed: ${res.status}`);
        }
        const data = (await res.json()) as ModelsResponse;
        if (!data.providers?.length) {
          throw new Error(data.error || "No models available.");
        }
        setModels(data.providers);
        setModelConfig(data.defaultConfig);
      } catch (err) {
        console.error("Failed to load models:", err);
        setError(err instanceof Error ? err.message : "Failed to load models.");
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (!intent.trim() || intent.length < 10) return;
    
    setFetchingSuggestions(true);
    
    // Run both suggestions and intelligent model selection in parallel
    const timer = setTimeout(async () => {
      try {
        const [suggestionsRes, modelSelectionRes] = await Promise.allSettled([
          fetch("/api/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent, modelConfig })
          }),
          fetch("/api/model-selection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent,
              projectDescription: context.project,
              complexity: context.projectComplexity || "medium",
              taskType: "structured",
              maxCost: 0 // Only free models
            })
          })
        ]);
        
        // Handle suggestions
        if (suggestionsRes.status === "fulfilled") {
          try {
            const suggestionsResponse = await suggestionsRes.value;
            if (!suggestionsResponse.ok) {
              console.error("Suggestions API returned error:", suggestionsResponse.status, suggestionsResponse.statusText);
              const errorText = await suggestionsResponse.text();
              console.error("Error response body:", errorText);
              throw new Error(`Suggestions API failed: ${suggestionsResponse.status}`);
            }
            const data = await suggestionsResponse.json();
            if (data.suggestions) {
              setSuggestions(data.suggestions);
            }
          } catch (parseError) {
            console.error("Failed to parse suggestions response:", parseError);
            const errorText = await suggestionsRes.value.text();
            console.error("Raw response:", errorText);
          }
        }
        
        // Handle intelligent model selection
        if (modelSelectionRes.status === "fulfilled") {
          try {
            const modelSelectionResponse = await modelSelectionRes.value;
            if (!modelSelectionResponse.ok) {
              console.error("Model selection API returned error:", modelSelectionResponse.status, modelSelectionResponse.statusText);
              const errorText = await modelSelectionResponse.text();
              console.error("Error response body:", errorText);
              throw new Error(`Model selection API failed: ${modelSelectionResponse.status}`);
            }
            const data = await modelSelectionResponse.json();
            if (data.success && data.selectedModel) {
              // Only auto-apply if user hasn't manually selected a model yet
              // Allow auto-selection if: no config set, current model is default/first, OR recommendation is significantly better
              const isFirstModel = modelConfig && modelConfig.model === models.find(m => m.provider === modelConfig.provider)?.models[0];
              const isRecommendedModel = data.selectedModel.model.includes("llama-4") || 
                                      data.selectedModel.model.includes("claude-3.5") || 
                                      data.selectedModel.model.includes("gpt-4");
              
              if (!modelConfig || isFirstModel || isRecommendedModel) {
                setModelConfig({
                  provider: data.selectedModel.provider,
                  model: data.selectedModel.model
                });
                setAutoSelectedModel(true);
                console.log("Auto-selected optimal model:", data.selectedModel.model, "Reasoning:", data.reasoning);
                
                // Clear auto-selection indicator after 3 seconds
                setTimeout(() => setAutoSelectedModel(false), 3000);
              }
            }
          } catch (parseError) {
            console.error("Failed to parse model selection response:", parseError);
            const errorText = await modelSelectionRes.value.text();
            console.error("Raw response:", errorText);
          }
        }
      } catch (err) {
        console.error("Failed to fetch suggestions or select model:", err);
      } finally {
        setFetchingSuggestions(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [intent, modelConfig]);

  const currentModels = useMemo(() => {
    if (!modelConfig) return [];
    return models.find((entry) => entry.provider === modelConfig.provider)?.models ?? [];
  }, [models, modelConfig]);

  const filteredModels = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();
    return currentModels.filter((model) => {
      const legacy = isLegacyModel(model);
      const isFree = isFreeModel(model, modelConfig?.provider as Provider);
      
      const includeByMode =
        modelView === "all" || 
        (modelView === "legacy" ? legacy : 
         modelView === "free" ? isFree :
         isRecommendedModel(model) && !legacy);

      if (!includeByMode) return false;
      if (!search) return true;
      return model.toLowerCase().includes(search) || formatModelLabel(model).toLowerCase().includes(search);
    });
  }, [currentModels, modelSearch, modelView, modelConfig?.provider]);

  const groupedFilteredModels = useMemo(() => {
    const groups = new Map<string, string[]>();
    filteredModels.forEach((model) => {
      const family = getModelFamily(model);
      groups.set(family, [...(groups.get(family) || []), model]);
    });
    return Array.from(groups.entries());
  }, [filteredModels]);

  const providerOptions = useMemo(
    () =>
      models.map((entry) => ({
        value: entry.provider,
        label: entry.provider.toUpperCase(),
        hint: `${entry.models.length} models`
      })),
    [models]
  );

  const instructionTargetOptions: Array<{ value: InstructionTarget; label: string; hint?: string }> = [
    { value: "claude", label: "CLAUDE.md" },
    { value: "agents", label: "AGENTS.md" },
    { value: "gemini", label: "GEMINI.md" },
    { value: "cursor", label: ".cursorrules" },
    { value: "windsurf", label: ".windsurfrules" },
    { value: "generic", label: "INSTRUCTIONS.md" }
  ];

  const depthOptions: Array<{ value: "basic" | "detailed"; label: string }> = [
    { value: "basic", label: "Basic" },
    { value: "detailed", label: "Detailed" }
  ];

  useEffect(() => {
    if (!modelPickerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!modelPickerRef.current?.contains(event.target as Node)) {
        setModelPickerOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModelPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modelPickerOpen]);

  const onCompile = async () => {
    if (!intent.trim() || !modelConfig) return;

    setCompiling(true);
    setError("");

    try {
      const constraints = constraintsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        intent,
        context: { ...context, constraints },
        modelConfig
      };

      const res = await fetch("/api/compilation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as CompileResponse;
      console.log("Compilation response:", data);
      
      if (!res.ok) {
        console.error("Compilation API error:", res.status, data);
        throw new Error(data.error || `Compilation failed with status ${res.status}`);
      }
      
      if (!data.steps?.length && !data.workflow?.steps?.length) {
        console.error("No steps in compilation response:", data);
        console.error("data.steps:", data.steps);
        console.error("data.workflow?.steps:", data.workflow?.steps);
        throw new Error(data.error || "No workflow steps generated.");
      }

      // Support both new workflow format and legacy format
      const workflowData = data.workflow || {
        id: typeof window !== 'undefined' ? crypto.randomUUID() : '',
        steps: data.steps || []
      };

      sessionStorage.setItem(
        "intentCompilerWorkflow",
        JSON.stringify({
          workflow: workflowData,
          modelConfig: data.modelConfig
        })
      );

      router.push("/workflow");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed.");
    } finally {
      setCompiling(false);
    }
  };

  const onCompileInstruction = async () => {
    if (!intent.trim() || !modelConfig) return;
    setCompilingInstruction(true);
    setError("");
    setInstructionResult(null);

    try {
      const constraints = constraintsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        intent,
        context: { ...context, constraints },
        target,
        modelConfig
      };

      const res = await fetch("/api/compilation/compile-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as CompileInstructionResponse;
      if (!res.ok || !data.markdown) {
        throw new Error(data.error || "Instruction compilation failed.");
      }
      setInstructionResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Instruction compilation failed.");
    } finally {
      setCompilingInstruction(false);
    }
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex-1 max-w-4xl rounded-[2.5rem] border border-border bg-surface/70 p-12 shadow-2xl backdrop-blur-2xl"
    >
      <motion.div variants={itemVariants} className="mb-4 flex items-start justify-between gap-4 relative z-[40]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">
            <span className="bg-gradient-to-br from-accent via-accent to-accent/40 bg-clip-text text-transparent">
              Intent
            </span> Compiler
          </h1>
          <p className="mt-1.5 text-sm text-muted">Reactive workflow system for intent-driven execution.</p>
        </div>
        <div className="flex bg-surfaceAlt/30 p-1 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setViewMode("build")}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.12em] rounded-lg transition-all ${
              viewMode === "build" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted hover:text-text"
            }`}
          >
            Build
          </button>
          <button
            type="button"
            onClick={() => setViewMode("vibe")}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.12em] rounded-lg transition-all ${
              viewMode === "vibe" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted hover:text-text"
            }`}
          >
            Vibe
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32">
            <CompactDropdown
              placeholder="Presets"
              value=""
              onChange={(val) => {
                const preset = PRESETS.find(p => p.value === val);
                if (preset) {
                  setContext(prev => ({ ...prev, ...preset.context }));
                }
              }}
              options={PRESETS.map(p => ({ value: p.value, label: p.label }))}
              buttonClassName="!py-1.5 !text-[10px] uppercase tracking-[0.12em]"
            />
          </div>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={() => setAdvancedMode((prev) => !prev)}
            className="rounded-lg border border-border bg-surfaceAlt px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-text transition-colors hover:border-accent whitespace-nowrap"
          >
            {advancedMode ? "Advanced On" : "Advanced Off"}
          </motion.button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {viewMode === "vibe" ? (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="space-y-4"
          >
            {/* Library Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setLibraryOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-surfaceAlt px-4 py-2 text-xs font-medium text-text transition hover:border-accent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Manage Library
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VIBE_GALLERY.map((vibe) => (
              <button
                key={vibe.id}
                type="button"
                onClick={() => {
                  setContext({
                    project: vibe.context.project,
                    audience: vibe.context.audience,
                    techStack: vibe.context.tech_stack,
                    depth: "basic",
                    style: "Modern",
                    constraints: vibe.context.constraints
                  });
                  setViewMode("build");
                }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surfaceAlt/50 p-5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
              >
                <div className="mb-2 text-sm font-bold text-text group-hover:text-emerald-400">{vibe.name}</div>
                <div className="text-[11px] leading-relaxed text-muted">{vibe.description}</div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {vibe.context.tech_stack.split(",").slice(0, 2).map(tech => (
                    <span key={tech} className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-400/80">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs uppercase tracking-[0.12em] text-muted">What do you want to do?</label>
            <AnimatePresence>
              {fetchingSuggestions && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-2 w-2 border border-accent border-t-transparent rounded-full"
                  />
                  <span className="text-[10px] text-accent uppercase tracking-wider font-medium">Refining Suggestions</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={4}
            placeholder="Describe your intent..."
            className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20"
          />
          <AnimatePresence>
            {!intent.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <MarqueeCarousel items={EXAMPLE_INTENTS} onSelect={setIntent} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ModelRecommendationBadge
            recommendation={recommendation}
            loading={loadingRecommendation}
            onApply={(config) => {
              setModelConfig(config);
              setModelPickerOpen(false);
              setAutoSelectedModel(false); // User manually selected, clear auto indicator
            }}
          />
          
          {/* Auto-selection indicator */}
          {autoSelectedModel && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
            >
              🤖 Auto-selected optimal model for your project
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 relative z-[30]">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Provider</label>
            {loadingModels ? (
              <div className="h-10 animate-pulse rounded-lg border border-border bg-surfaceAlt" />
            ) : (
              <CompactDropdown
                value={modelConfig?.provider ?? providerOptions[0]?.value ?? "aicc"}
                options={providerOptions}
                onChange={(provider) => {
                  const providerModels = models.find((entry) => entry.provider === provider)?.models ?? [];
                  setModelConfig({ provider, model: providerModels[0] ?? "" });
                  setModelSearch("");
                  setModelView("recommended");
                  setModelPickerOpen(false);
                  setAutoSelectedModel(false); // User manually selected, clear auto indicator
                }}
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Model</label>
            {loadingModels ? (
              <div className="h-10 animate-pulse rounded-lg border border-border bg-surfaceAlt" />
            ) : (
              <div ref={modelPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setModelPickerOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-left text-sm text-text outline-none transition hover:border-accent focus:border-accent"
                >
                  <span className="truncate">{modelConfig?.model ?? "Select model"}</span>
                  <span className="ml-2 text-xs text-muted">{modelPickerOpen ? "^" : "v"}</span>
                </button>

                <AnimatePresence>
                  {modelPickerOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="absolute z-40 mt-2 w-full rounded-xl border border-border bg-[#08101b] p-3 shadow-2xl"
                    >
                      <input
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        autoComplete="off"
                        spellCheck={false}
                        name="model_search"
                        className="mb-2 w-full rounded-md border border-border bg-surfaceAlt px-2.5 py-2 text-xs text-text outline-none transition focus:border-accent"
                      />

                      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {(["recommended", "free", "all", "legacy"] as ModelViewMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setModelView(mode)}
                            className={`rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.12em] whitespace-nowrap transition ${
                              modelView === mode
                                ? "border border-accent bg-accent/15 text-accent"
                                : "border border-border text-muted hover:border-accent/40 hover:text-text"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {groupedFilteredModels.length ? (
                          groupedFilteredModels.map(([family, familyModels]) => (
                            <div key={family}>
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{family}</p>
                              <div className="space-y-1">
                                {familyModels.map((model) => (
                                  <button
                                    key={model}
                                    type="button"
                                    onClick={() => {
                                      setModelConfig((prev) => (prev ? { ...prev, model } : null));
                                      setModelPickerOpen(false);
                                      setAutoSelectedModel(false); // User manually selected, clear auto indicator
                                    }}
                                    className={`w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition relative group ${
                                      modelConfig?.model === model
                                        ? "border-accent bg-accent/15 text-accent"
                                        : "border-border text-text hover:border-accent/50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="truncate font-medium">{formatModelLabel(model)}</p>
                                      {isFreeModel(model, modelConfig?.provider as Provider) && (
                                        <span className="shrink-0 rounded-[4px] bg-emerald-500/10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                                          Free
                                        </span>
                                      )}
                                    </div>
                                    <p className="truncate text-[10px] text-muted mt-0.5">{model}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-md border border-border px-2 py-4 text-center text-xs text-muted">
                            No models match this filter.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3 relative z-[20]">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted font-bold">Instruction Target</label>
            <CompactDropdown
              value={target}
              onChange={setTarget}
              options={instructionTargetOptions}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 relative z-[10]">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Project</label>
            <input
              value={context.project}
              onChange={(e) => setContext((prev) => ({ ...prev, project: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
            <SuggestionChips 
              suggestions={suggestions.project} 
              onSelect={(val) => setContext(prev => ({ ...prev, project: val }))} 
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Audience</label>
            <input
              value={context.audience}
              onChange={(e) => setContext((prev) => ({ ...prev, audience: e.target.value }))}
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
            <SuggestionChips 
              suggestions={suggestions.audience} 
              onSelect={(val) => setContext(prev => ({ ...prev, audience: val }))} 
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {advancedMode && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0, height: 0, overflow: "hidden" },
                visible: {
                  opacity: 1,
                  height: "auto",
                  transition: { 
                    duration: 0.4, 
                    ease: [0.23, 1, 0.32, 1],
                    staggerChildren: 0.08 
                  },
                  transitionEnd: { overflow: "visible" }
                }
              }}
              className="overflow-visible relative z-[5]"
              onAnimationComplete={() => {
                // Ensure it's visible after animation to prevent clipping of absolute children
              }}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <motion.div variants={itemVariants} className="relative z-[30]">
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Depth</label>
                  <CompactDropdown
                    value={context.depth}
                    onChange={(value) => setContext((prev) => ({ ...prev, depth: value }))}
                    options={depthOptions}
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="relative z-[20]">
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Style</label>
                  <input
                    value={context.style}
                    onChange={(e) => setContext((prev) => ({ ...prev, style: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                  />
                  <SuggestionChips 
                    suggestions={suggestions.style} 
                    onSelect={(val) => setContext(prev => ({ ...prev, style: val }))} 
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="relative z-[10]">
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Tone</label>
                  <input
                    value={context.tone}
                    onChange={(e) => setContext((prev) => ({ ...prev, tone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                  />
                  <SuggestionChips 
                    suggestions={suggestions.tone} 
                    onSelect={(val) => setContext(prev => ({ ...prev, tone: val }))} 
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="md:col-span-3 relative z-0">
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted">Constraints</label>
                  <input
                    value={constraintsInput}
                    onChange={(e) => setConstraintsInput(e.target.value)}
                    placeholder="comma,separated,constraints"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                  />
                  <SuggestionChips 
                    suggestions={suggestions.constraints} 
                    onSelect={(val) => {
                      const current = constraintsInput.split(",").map(c => c.trim()).filter(Boolean);
                      if (!current.includes(val)) {
                        setConstraintsInput([...current, val].join(", "));
                      }
                    }} 
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <motion.div variants={itemVariants} className="flex flex-wrap gap-2 relative z-0">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={onCompile}
            disabled={compiling || !intent.trim() || !modelConfig}
            className="group relative flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
          >
            {compiling ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-4 w-4 border-2 border-black border-t-transparent rounded-full"
                />
                Compiling...
              </span>
            ) : (
              "Compile Workflow"
            )}
            <motion.div
              className="absolute inset-0 rounded-md bg-accent opacity-0 blur-lg transition-opacity group-hover:opacity-40"
              initial={false}
            />
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={onCompileInstruction}
            disabled={compilingInstruction || !intent.trim() || !modelConfig}
            className="rounded-md border border-border bg-surfaceAlt px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-accent disabled:opacity-50"
          >
            {compilingInstruction ? "Compiling Instruction..." : "Compile Instruction File"}
          </motion.button>
          </motion.div>
        </>
      )}
    </div>

      <AnimatePresence>
        {compilingInstruction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-3 grid gap-3"
          >
            <div className="h-16 animate-pulse rounded-lg border border-border bg-surfaceAlt/50" />
            <div className="h-16 animate-pulse rounded-lg border border-border bg-surfaceAlt/50" />
            <div className="h-24 animate-pulse rounded-lg border border-border bg-surfaceAlt/50" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {instructionResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="rounded-lg border border-border bg-surfaceAlt/70 p-4 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Intent Refinement</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{JSON.stringify(instructionResult.refinement, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-border bg-surfaceAlt/70 p-4 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Context Builder</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{JSON.stringify(instructionResult.structuredContext, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-border bg-surfaceAlt/70 p-4 shadow-sm">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Behavior Compiler</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{JSON.stringify(instructionResult.behavior, null, 2)}</pre>
            </div>
            {instructionResult.quality ? (
              <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">Quality Report</p>
                  <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    Score: {instructionResult.quality.score}/100
                  </span>
                </div>
                <div className="grid gap-2 text-xs text-text md:grid-cols-3">
                  <p>Correctness: {instructionResult.quality.dimensions.correctness.toFixed(1)}/5</p>
                  <p>Specificity: {instructionResult.quality.dimensions.specificity.toFixed(1)}/5</p>
                  <p>Executability: {instructionResult.quality.dimensions.executability.toFixed(1)}/5</p>
                  <p>Safety: {instructionResult.quality.dimensions.safety.toFixed(1)}/5</p>
                  <p>Compatibility: {instructionResult.quality.dimensions.compatibility.toFixed(1)}/5</p>
                  <p>Brevity: {instructionResult.quality.dimensions.brevity.toFixed(1)}/5</p>
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted">Issues</p>
                  {instructionResult.quality.issues.length ? (
                    <ul className="space-y-1 text-xs text-text">
                      {instructionResult.quality.issues.slice(0, 8).map((issue, idx) => (
                        <li key={`${issue.category}-${idx}`} className="rounded border border-border/70 bg-black/20 px-2 py-1">
                          <span className="mr-1 font-semibold uppercase text-muted">[{issue.severity}]</span>
                          <span className="mr-1 text-muted">({issue.category})</span>
                          <span>{issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-300">No issues found. File passed all current checks.</p>
                  )}
                </div>
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-black/30 p-4 shadow-inner">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">Instruction File</p>
              <pre className="whitespace-pre-wrap text-xs text-text">{instructionResult.markdown}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vibe Library Modal */}
      <VibeLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        builtInVibes={VIBE_GALLERY}
        onSelectVibe={(vibe) => {
          setContext({
            project: vibe.context.project,
            audience: vibe.context.audience,
            techStack: vibe.context.tech_stack,
            depth: "basic",
            style: "Modern",
            constraints: vibe.context.constraints
          });
          setLibraryOpen(false);
          setViewMode("build");
        }}
      />
    </motion.section>
  );
}
