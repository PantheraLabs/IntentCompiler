# Intent Compiler — Project Proposal & Northstar Document

> **The definitive reference for the Intent Compiler initiative: vision, architecture, strategy, and future roadmap.**
> 
> **Version**: 1.0.0 | **Status**: Active Development | **Last Updated**: March 2026  
> **Author**: Rishi Praseeth Krishnan | **Classification**: Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Concept & Philosophy](#2-core-concept--philosophy)
3. [Market Opportunity](#3-market-opportunity)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Product Architecture](#5-product-architecture)
6. [Feature Roadmap](#6-feature-roadmap)
7. [Business Model & Monetization](#7-business-model--monetization)
8. [Go-to-Market Strategy](#8-go-to-market-strategy)
9. [Technical Deep Dive](#9-technical-deep-dive)
10. [Risk Analysis](#10-risk-analysis)
11. [Success Metrics](#11-success-metrics)
12. [Future Vision](#12-future-vision)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 The Opportunity

AI coding assistants (Claude, Cursor, GitHub Copilot) have revolutionized software development, but they suffer from a critical limitation: **context fragmentation**. Developers spend 30-40% of their AI interaction time repeating project context, constraints, and preferences. Meanwhile, AI companies are racing to own the developer workflow, creating platform lock-in through proprietary instruction formats.

**Intent Compiler** solves this by creating a **universal intent-to-execution layer** that:
- Captures and refines developer intent into structured, actionable plans
- Generates platform-native instruction files from a unified source
- Orchestrates multi-step AI workflows with validation and quality gates
- Remains provider-agnostic, supporting 1000+ models across Groq, OpenRouter, Ollama, OpenAI

### 1.2 Key Value Propositions

| Stakeholder | Pain Point | Intent Compiler Solution |
|-------------|------------|--------------------------|
| **Individual Developers** | Repetitive context-setting with AI assistants | One-time intent capture, reusable instruction files |
| **Development Teams** | Inconsistent AI output across team members | Standardized behavior definitions, shared vibe templates |
| **AI-Native Startups** | High API costs from inefficient prompting | Tier-based model selection, optimal cost/quality routing |
| **Enterprises** | Security/privacy concerns with cloud AI | Local LLM support via Ollama, private infrastructure |
| **AI Tool Builders** | Fragmented instruction file ecosystem | Universal compiler with multi-format export |

### 1.3 Current Status & Traction

- **MVP**: Functional with 6 instruction formats, 17 built-in vibe templates, multi-provider support
- **Technical Foundation**: Next.js 15, React 19, TypeScript 5.8, AICC abstraction layer
- **Model Support**: 1000+ models via OpenRouter, Llama via Groq, local via Ollama
- **Next Milestone**: Workflow execution engine with step validation and project generation

### 1.4 Funding & Resource Requirements

| Phase | Timeline | Investment | Focus |
|-------|----------|------------|-------|
| **Bootstrap** | Current | Self-funded | MVP completion, core workflows |
| **Seed** | Q3 2026 | $500K-$1M | Execution engine, cloud offering, team expansion |
| **Series A** | 2027 | $3M-$5M | Enterprise features, marketplace, ecosystem |

---

## 2. Core Concept & Philosophy

### 2.1 The Intent-Execution Gap

Modern AI systems are **powerful but blunt instruments**. A developer might say:

> *"Build me a React dashboard for visualizing IoT sensor data"*

But the AI needs to know:
- What charting library? (Recharts, D3, Victory?)
- Real-time or batched data? (WebSocket, polling, server-sent events?)
- Authentication requirements? (JWT, OAuth2, session-based?)
- Performance constraints? (Bundle size, render optimization?)
- Accessibility standards? (WCAG 2.1 AA compliance?)

**Intent Compiler** bridges this gap through a **systematic refinement pipeline**:

```
Vague Intent → Interpreted Intent → Assumptions → Clarified Goal → Structured Context → Behavior Definition → Executable Plan
```

### 2.2 Core Philosophy: "Compile, Don't Prompt"

The fundamental shift is from **imperative prompting** (telling AI what to do step-by-step) to **declarative intent** (describing what you want, letting the system determine how).

| Aspect | Traditional Approach | Intent Compiler Approach |
|--------|---------------------|--------------------------|
| **Input** | Detailed prompts with examples | High-level intent description |
| **Process** | Manual iteration, trial-and-error | Systematic refinement with validation |
| **Output** | Single response, throwaway context | Reusable instruction files, executable workflows |
| **Evolution** | Context lost between sessions | Persistent, versioned intent definitions |
| **Collaboration** | Individual tacit knowledge | Shareable, standardized templates |

### 2.3 Design Principles

1. **Provider Agnosticism**: No vendor lock-in. Seamlessly switch between Claude, GPT, Llama, Gemini, or local models.

2. **Tier-Based Intelligence**: Match task complexity to model capability. Don't use GPT-4 for simple formatting.

3. **Progressive Disclosure**: Simple by default, powerful when needed. Basic mode for quick tasks, advanced mode for complex orchestration.

4. **Export-First**: Everything compiles to portable formats. Your intent isn't trapped in our system.

5. **Zero-Click Context**: Auto-detect project structure, tech stack, and conventions. Minimize manual input.

6. **Quality Observability**: Every output graded across 6 dimensions (correctness, specificity, executability, safety, compatibility, brevity).

### 2.4 The Vibe Concept

A **Vibe** is a pre-configured project template encoding domain knowledge:

- **Shadcn Vibe**: Next.js + Tailwind + Shadcn/UI + TypeScript strict mode
- **Event-Driven Microservices**: Kafka + PostgreSQL + Node.js + Docker
- **Agentic AI System**: LangChain + Vector DB + FastAPI + Redis

Vibes capture **tribal knowledge** that usually exists only in senior developers' heads. They make expert-level project setup accessible to everyone.

---

## 3. Market Opportunity

### 3.1 Market Size & Growth

| Segment | TAM (2026) | CAGR | Intent Compiler Addressable |
|---------|------------|------|------------------------------|
| **AI Coding Assistants** | $8.2B | 35% | Instruction file generation, workflow orchestration |
| **Low-Code/No-Code** | $22.5B | 28% | Intent-to-application compilation |
| **DevOps Automation** | $12.8B | 22% | CI/CD workflow generation, infrastructure-as-code |
| **Enterprise AI** | $45.6B | 41% | Multi-model orchestration, compliance, audit |
| **Total Addressable** | **$89.1B** | **32%** | Cross-segment platform play |

### 3.2 Target Personas

#### Primary: The AI-Native Developer
- **Profile**: 25-35 years old, uses Cursor/Claude/Windsurf daily, builds side projects, active on GitHub/Twitter
- **Pain Points**: Repetitive context setting, inconsistent AI output, API cost anxiety
- **Value Prop**: Reusable instruction files, optimal model selection, team standardization
- **Acquisition**: Twitter/X, GitHub, Hacker News, AI engineering newsletters

#### Secondary: The Tech Lead
- **Profile**: Senior engineer at Series A-C startup, responsible for team productivity and code quality
- **Pain Points**: Junior devs get inconsistent AI help, onboarding new developers, maintaining standards
- **Value Prop**: Team vibe library, standardized behavior definitions, quality scoring
- **Acquisition**: Engineering blogs, conference talks, LinkedIn

#### Tertiary: The Enterprise Architect
- **Profile**: Large company (500+ engineers), evaluating AI tools for compliance and standardization
- **Pain Points**: Security concerns with cloud AI, vendor lock-in risk, need audit trails
- **Value Prop**: Local LLM support, private infrastructure deployment, instruction governance
- **Acquisition**: Direct sales, conference sponsorships, analyst briefings

### 3.3 Market Timing

**Why Now?**

1. **AI Model Proliferation**: 1000+ models available, no clear winner, need intelligent routing
2. **Instruction File Standardization**: CLAUDE.md, .cursorrules, .windsurfrules emerging as de facto standards
3. **Developer Workflow Integration**: AI assistants becoming IDE-native, need systematic context management
4. **Cost Pressure**: Teams hitting API rate limits, seeking optimization strategies
5. **Remote/Hybrid Work**: Async development requires better documentation of intent and context

### 3.4 Adjacent Market Opportunities

- **Technical Documentation**: Auto-generate README, API docs, architecture decision records from intent
- **Code Review**: Intent-based diff review ("does this change match the stated goal?")
- **Testing**: Generate test cases from intent descriptions, property-based testing suggestions
- **Security**: Intent-aware security scanning ("this code handles PII, apply GDPR patterns")

---

## 4. Competitive Landscape

### 4.1 Direct Competitors

| Competitor | Strengths | Weaknesses | Our Differentiation |
|------------|-----------|------------|---------------------|
| **Cursor** | Deep IDE integration, fast iteration | Proprietary .cursorrules only, no multi-model | Export to any format, provider agnostic |
| **Claude Code** | Excellent reasoning, large context | Limited to Anthropic models, expensive | Multi-provider, cost optimization, local LLM |
| **GitHub Copilot** | Ubiquitous, Microsoft ecosystem | Black box, no workflow orchestration | Transparent workflows, quality scoring, instruction files |
| **Aider** | Great for existing codebases, multi-file | CLI-only, steep learning curve | Visual workflow builder, vibe templates, broader use cases |
| **Supermaven** | Fast, cheap, 1M token context | Limited customization, no instruction files | Flexible instruction system, model choice |

### 4.2 Indirect Competitors

| Category | Examples | Our Overlap |
|----------|----------|-------------|
| **Low-Code Platforms** | Webflow, Bubble, Retool | Intent-to-application for developers |
| **Workflow Automation** | Zapier, Make, n8n | AI-native workflow orchestration |
| **Prompt Management** | PromptLayer, PromptHub, LangSmith | Structured prompt compilation vs. raw prompt storage |
| **AI Agents** | AutoGPT, BabyAGI, LangChain agents | Controlled, validated execution vs. autonomous chaos |

### 4.3 Competitive Moats

1. **Multi-Format Instruction Export**: Only platform supporting 6+ instruction file formats
2. **AICC Abstraction**: 1000+ models, intelligent routing, seamless failover
3. **Vibe Library Network Effects**: Community-contributed templates, winner-take-most dynamics
4. **Quality Scoring System**: 6-dimensional evaluation, feedback loop for improvement
5. **Zero-Click Context**: Project auto-detection reduces friction vs. manual configuration

### 4.4 Strategic Positioning

**Positioning Statement**:
> For AI-native developers who are frustrated with repetitive context-setting and inconsistent AI output, Intent Compiler is a universal intent-to-execution platform that transforms vague goals into structured, actionable plans—unlike single-provider assistants, we compile portable instruction files and orchestrate workflows across any LLM.

---

## 5. Product Architecture

### 5.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           INTENT COMPILER PLATFORM                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              PRESENTATION LAYER                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │  Context Form│  │   Workflow   │  │   Vibe       │  │   Export     │     │   │
│  │  │  (Input)     │  │   Builder    │  │   Library    │  │   Preview    │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           COMPILATION ENGINE                                   │   │
│  │                                                                                │   │
│  │   Intent Refinement → Context Building → Behavior Def → Workflow Generation   │   │
│  │        (Tier 1)          (Tier 2)           (Tier 2)         (Tier 3)          │   │
│  │                                                                                │   │
│  │   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐      │   │
│  │   │  Quality   │───▶│  Validation│───▶│  Scoring   │───▶│  Feedback  │      │   │
│  │   │  Check     │    │  Gate      │    │  Engine    │    │  Loop      │      │   │
│  │   └────────────┘    └────────────┘    └────────────┘    └────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         AICC — AI CONTROL CENTER                               │   │
│  │                                                                                │   │
│  │    ┌────────┐   ┌────────────┐   ┌────────┐   ┌────────┐   ┌──────────┐    │   │
│  │    │  Groq  │   │ OpenRouter │   │ Ollama │   │ OpenAI │   │ Custom   │    │   │
│  │    │ (Fast) │   │  (Broad)   │   │(Local) │   │(Reliable)│  │ Providers│    │   │
│  │    └────────┘   └────────────┘   └────────┘   └────────┘   └──────────┘    │   │
│  │                                                                                │   │
│  │   Model Discovery → Capability Scoring → Cost Estimation → Routing Decision    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              EXPORT LAYER                                      │   │
│  │                                                                                │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │   │ CLAUDE.md│  │.cursorrls│  │.windsurf │  │AGENTS.md │  │ Workflow │      │   │
│  │   │          │  │          │  │  rules   │  │          │  │  JSON    │      │   │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  │                                                                                │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐                                     │   │
│  │   │  PDF     │  │  ZIP     │  │ Git Commit│ (Future)                           │   │
│  │   │  Export  │  │  Bundle  │  │  Direct   │                                     │   │
│  │   └──────────┘  └──────────┘  └──────────┘                                     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 The Four Core Workflows

#### Workflow 1: Instruction File Generation (Current MVP)
```
User Intent → Refinement → Context → Behavior → Target-Specific Markdown → Preview/Download
```
**Use Case**: Setting up AI assistant context for a new project  
**Output**: CLAUDE.md, .cursorrules, etc.  
**Time**: 10-30 seconds  

#### Workflow 2: Step-by-Step Execution Plan (In Development)
```
User Intent → Refinement → Context → Multi-Step Workflow → Validation → Execution UI
```
**Use Case**: Complex multi-file changes with dependencies  
**Output**: Interactive step execution with rollback  
**Time**: Minutes to hours (depending on complexity)  

#### Workflow 3: Project Scaffolding (Planned)
```
User Intent → Vibe Selection → Architecture Generation → File Tree → Download/Deploy
```
**Use Case**: Greenfield project from concept to repository  
**Output**: Complete project structure, initialized git, dependencies  
**Time**: 1-5 minutes  

#### Workflow 4: Workflow Library/Sharing (Planned)
```
User Intent → Community Search → Template Adaptation → Personalization → Export
```
**Use Case**: Discover and adapt proven workflows  
**Output**: Customized workflow from community template  
**Time**: Instant to minutes  

### 5.3 The Compilation Pipeline

Each workflow follows a **4-stage refinement pipeline**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   STAGE 1   │────▶│   STAGE 2   │────▶│   STAGE 3   │────▶│   STAGE 4   │
│   Refine    │     │   Structure │     │   Behavior  │     │   Execute   │
│   Intent    │     │   Context   │     │   Define    │     │   / Export  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Input:      │     │ Input:      │     │ Input:      │     │ Input:      │
│ Raw text    │     │ Refined     │     │ Structured  │     │ Behavior    │
│ "Build..."  │     │ intent +    │     │ context     │     │ definition  │
│             │     │ assumptions │     │             │     │             │
├─────────────┤     ├─────────────┤     ├─────────────┤     ├─────────────┤
│ Output:     │     │ Output:     │     │ Output:     │     │ Output:     │
│ interpreted │     │ project,    │     │ role,       │     │ Markdown/   │
│ _intent     │     │ audience,   │     │ objectives, │     │ JSON/       │
│ assumptions │     │ tech_stack, │     │ rules,      │     │ Executed    │
│ clarified   │     │ constraints │     │ style,      │     │ steps       │
│ _goal       │     │             │     │ format      │     │             │
├─────────────┤     ├─────────────┤     ├─────────────┤     ├─────────────┤
│ Model:      │     │ Model:      │     │ Model:      │     │ Model:      │
│ Speed       │     │ Efficiency  │     │ Efficiency  │     │ Quality     │
│ (fast)      │     │ (balanced)  │     │ (balanced)  │     │ (capable)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 6. Feature Roadmap

### 6.1 Phase 1: Foundation (Current — Q2 2026)

**Status**: 80% Complete  
**Theme**: Core compilation engine, multi-provider support, instruction export

| Feature | Status | Priority |
|---------|--------|----------|
| AICC multi-provider abstraction | ✅ Complete | P0 |
| 6 instruction file formats | ✅ Complete | P0 |
| Intent refinement pipeline | ✅ Complete | P0 |
| 17 built-in vibe templates | ✅ Complete | P0 |
| Model recommendation engine | ✅ Complete | P0 |
| Quality scoring system | ✅ Complete | P0 |
| Project auto-detection | ✅ Complete | P0 |
| SQLite vibe library | ✅ Complete | P1 |
| Basic workflow execution | 🔄 In Progress | P0 |
| Step validation | 📋 Planned | P0 |

**Definition of Done**: Developer can input intent, get refined context, generate instruction file, and download in target format.

### 6.2 Phase 2: Execution Engine (Q3 2026)

**Theme**: From static instructions to dynamic execution

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Workflow Execution UI** | Interactive step-by-step execution with progress, logs, and results | Enables complex multi-step tasks |
| **Dependency Resolution** | DAG-based step ordering with automatic parallelization where safe | Faster execution, resource optimization |
| **Rollback & Recovery** | Automatic savepoints, one-click rollback on failure | Safety, experimentation |
| **Human-in-the-Loop** | Pause for approval at critical steps, edit and resume | Trust, complex decision points |
| **Tool Integration** | Shell command execution, file operations, API calls | Beyond text generation |
| **Live Preview** | Real-time preview of code changes, diffs, rendered output | Immediate feedback |
| **Workflow Library** | Save, organize, and reuse personal workflows | User retention, productivity |
| **Team Workspaces** | Shared workflow library, team vibes, permissioning | Team collaboration, enterprise readiness |

**Success Metrics**: 50% of users create and execute at least one multi-step workflow.

### 6.3 Phase 3: Project Generation (Q4 2026)

**Theme**: From instructions to complete projects

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Full Project Scaffolding** | Generate entire project structure from intent | Greenfield acceleration |
| **Architecture Patterns** | MVC, microservices, event-driven, serverless | Best practice enforcement |
| **Dependency Management** | Auto-install npm/pip/cargo dependencies | Zero-friction setup |
| **Environment Setup** | Docker, docker-compose, dev container configs | Reproducible environments |
| **Test Generation** | Auto-generate test suites based on intent | Quality assurance |
| **Documentation Generation** | README, API docs, architecture diagrams | Professional delivery |
| **Git Integration** | Initialize repo, initial commit, branch setup | Ready to collaborate |
| **Deploy Templates** | Vercel, Railway, AWS, GCP one-click deploy | Faster time-to-production |

**Success Metrics**: 20% of workflows generate complete, runnable projects.

### 6.4 Phase 4: Intelligence & Ecosystem (2027)

**Theme**: Network effects, advanced AI, enterprise scale

| Feature | Description | Business Value |
|---------|-------------|----------------|
| **Community Marketplace** | Share and monetize vibes, workflows, templates | Network effects, revenue |
| **Intent Analytics** | Usage patterns, success rates, optimization suggestions | Continuous improvement |
| **Multi-Agent Orchestration** | Coordinate multiple specialized AI agents | Complex system building |
| **Knowledge Graph** | Project-aware context, relationship mapping | Deeper understanding |
| **Enterprise Governance** | Audit logs, approval workflows, compliance scanning | Enterprise adoption |
| **IDE Plugins** | VS Code, JetBrains, Vim native integration | Ubiquitous availability |
| **CI/CD Integration** | GitHub Actions, GitLab CI, CircleCI workflows | DevOps automation |
| **Custom Model Fine-tuning** | Train models on company-specific patterns | Competitive advantage |

**Success Metrics**: 1000+ community templates, 100+ enterprise customers.

---

## 7. Business Model & Monetization

### 7.1 Revenue Streams

#### Stream 1: SaaS Subscriptions (Primary)

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| **Free** | $0 | 50 compiles/month, 3 vibes, basic models | Individual exploration |
| **Pro** | $19/mo | Unlimited compiles, unlimited vibes, all models, workflow execution | Individual professionals |
| **Team** | $49/user/mo | Team workspace, shared vibes, workflow library, priority support | Small teams (2-20) |
| **Enterprise** | Custom | SSO, audit logs, private LLM, custom training, dedicated success | Large orgs (50+) |

**Pricing Strategy**: Seat-based with usage limits to manage API costs. Free tier for viral growth, Pro for power users, Team for collaboration, Enterprise for compliance.

#### Stream 2: Marketplace Commission (Secondary)

- Community creators sell premium vibes and workflows
- Platform takes 20-30% commission
- Quality curation to maintain standards

**Projected Revenue**: 15% of total by Year 2

#### Stream 3: API Access (Tertiary)

- Headless API for integration into other tools
- Usage-based pricing (per 1000 compiles)
- White-label options for platform builders

**Projected Revenue**: 10% of total by Year 2

### 7.2 Unit Economics

**Cost Structure** (per compile):

| Stage | Model Tier | Avg Tokens | Cost | Notes |
|-------|------------|------------|------|-------|
| Refinement | Speed | 1K | $0.001 | Cached for 5 minutes |
| Context | Efficiency | 2K | $0.005 | |
| Behavior | Efficiency | 3K | $0.008 | |
| Execution | Quality | 10K | $0.05 | Only for workflows |
| **Total (Instruction)** | | | **$0.014** | |
| **Total (Workflow)** | | | **$0.064** | |

**Gross Margins**:
- Instruction generation: 85% (sell at $0.10 effective)
- Workflow execution: 75% (sell at $0.25 effective)

### 7.3 Financial Projections

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **Users** | 10,000 | 100,000 | 500,000 |
| **Paid Users** | 500 (5%) | 8,000 (8%) | 50,000 (10%) |
| **ARPU** | $180 | $220 | $250 |
| **MRR** | $7,500 | $147,000 | $1,040,000 |
| **ARR** | $90,000 | $1.76M | $12.5M |
| **API Costs** | $35,000 | $400,000 | $2.5M |
| **Gross Profit** | $55,000 | $1.36M | $10M |
| **Team Size** | 3 | 12 | 35 |
| **Burn Rate** | $25K/mo | $80K/mo | $250K/mo |

**Path to Profitability**: Month 18 with $500K MRR

---

## 8. Go-to-Market Strategy

### 8.1 Launch Strategy

#### Phase 1: Stealth (Current)
- **Duration**: 2 months
- **Activities**: Build in public on Twitter/X, gather feedback from 50 beta users
- **Goals**: Validate core workflows, iterate on UX, build waitlist

#### Phase 2: Public Beta (Q3 2026)
- **Duration**: 2 months
- **Activities**: Product Hunt launch, Hacker News Show HN, influencer partnerships
- **Goals**: 5,000 signups, 1,000 MAU, identify power users

#### Phase 3: General Availability (Q4 2026)
- **Duration**: Ongoing
- **Activities**: Paid acquisition, content marketing, conference presence
- **Goals**: 10,000 users, 500 paid subscribers, product-market fit signals

### 8.2 Distribution Channels

| Channel | Strategy | Investment | Expected CAC |
|---------|----------|------------|--------------|
| **Organic Social** | Twitter/X threads, demo videos, build-in-public | $0 (time) | $0 |
| **Content SEO** | Technical blog, vibe templates as landing pages | $2K/mo | $5 |
| **Product Hunt** | Coordinated launch, maker engagement | $0 | $0 |
| **Newsletter Ads** | TLDR, Bytes, AI engineering newsletters | $5K/mo | $25 |
| **Influencer** | YouTube demos, Twitter partnerships | $3K/mo | $30 |
| **Community** | Discord, Reddit r/webdev, r/LocalLLaMA | $0 (time) | $0 |
| **Events** | ReactConf, AI Engineer Summit, local meetups | $10K | $50 |
| **Paid Social** | Twitter, LinkedIn retargeting | $10K/mo | $40 |

**Blended CAC Target**: <$20 for free users, <$50 for paid conversions

### 8.3 Content & Community Strategy

**The "Vibe" Content Series**:
- Weekly deep-dives into specific project types ("Building a Real-Time Chat App")
- Template + walkthrough + live coding session
- Distribution: YouTube, blog, newsletter

**Community Programs**:
- **Vibe Creator Grants**: $500 for high-quality community templates
- **Intent Compiler Champions**: Power user recognition, early access, swag
- **Office Hours**: Weekly AMA with founder, workflow reviews

### 8.4 Partnership Strategy

| Partner Type | Examples | Value Exchange |
|--------------|----------|----------------|
| **IDE Vendors** | Cursor, Windsurf, Zed | Native integration, distribution |
| **Cloud Providers** | Vercel, Railway, AWS | Deploy templates, credits |
| **AI Providers** | Groq, OpenRouter, Together | Co-marketing, preferred pricing |
| **Education** | Scrimba, Frontend Masters | Course integration, certification |
| **Open Source** | Next.js, Shadcn, Prisma | Template sponsorship |

---

## 9. Technical Deep Dive

### 9.1 Architecture Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TECHNOLOGY STACK                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FRONTEND                    BACKEND                  INFRASTRUCTURE     │
│  ────────                    ──────                  ─────────────      │
│                                                                         │
│  Next.js 15 (App Router)    Next.js API Routes      Vercel (primary)   │
│  React 19 (RSC + Client)     TypeScript 5.8          Docker (local)      │
│  Tailwind CSS 3.4           SQLite (libSQL)         Self-hosted option  │
│  Framer Motion              Zod (validation)       CDN (static)        │
│  Lucide React               OpenAI SDK             Edge functions      │
│                                                                         │
│  AI INTEGRATION              DATABASE               MONITORING         │
│  ─────────────               ────────               ──────────         │
│                                                                         │
│  OpenAI SDK (universal)     SQLite (local)          Console logging    │
│  Groq API                   Vercel KV (future)      Sentry (future)    │
│  OpenRouter API             PostgreSQL (scale)      Analytics (future)│
│  Ollama (local)                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 The AICC System (AI Control Center)

**Purpose**: Unified interface for 1000+ models across multiple providers

**Architecture**:

```typescript
// Core abstraction
interface AICCProvider {
  name: Provider;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  call(messages: AICCMessage[], model: string): Promise<AICCResponse>;
}

// Model selection strategy
interface ModelSelector {
  selectForTask(taskType: TaskType, budget?: number): Promise<ModelConfig>;
  scoreModel(model: string, task: TaskType): number;
}

// Provider implementations
- GroqProvider    → Fast Llama inference
- OpenRouterProvider → Broad model access
- OllamaProvider → Local private inference
- OpenAIProvider → Reliable structured output
```

**Intelligent Routing**:

```
User Request
     │
     ├─── Complexity Analysis ───┐
     │                          │
     ▼                          ▼
┌────────────┐           ┌─────────────┐
│   Simple   │           │   Complex   │
│  (suggest) │           │  (workflow) │
└─────┬──────┘           └──────┬──────┘
      │                          │
      ▼                          ▼
┌────────────┐           ┌─────────────┐
│Fast/Cheap  │           │ Capable      │
│ Model      │           │ Model        │
│($0.001)    │           │ ($0.05)     │
└────────────┘           └─────────────┘
```

**Caching Strategy**:
- Model lists: 2-10 minutes based on volatility
- Compilation results: 5 minutes (intent + context fingerprint)
- Provider availability: 30 seconds

### 9.3 The Compilation Pipeline

**Stage 1: Intent Refinement**

```typescript
interface RefinementEngine {
  // Input: Raw user intent
  // Output: Structured interpretation
  refine(intent: string): Promise<IntentRefinement>;
}

interface IntentRefinement {
  interpreted_intent: string;  // What we think they want
  assumptions: string[];         // What we're assuming
  clarified_goal: string;      // Precise objective
}
```

**Prompt Strategy**:
```
You are an intent clarification specialist.

Analyze this vague request: "{intent}"

Provide:
1. interpreted_intent: What is the user really asking for?
2. assumptions: What must be true for this to work?
3. clarified_goal: A precise, actionable statement

Return JSON only.
```

**Stage 2: Context Building**

```typescript
interface ContextBuilder {
  build(refinement: IntentRefinement, userContext: UserContext): Promise<StructuredContext>;
}

interface StructuredContext {
  project: string;           // Project name/type
  audience: string;          // Target users
  tech_stack: string;        // Technologies
  constraints: string[];      // Must-haves and must-nots
}
```

**Stage 3: Behavior Definition**

```typescript
interface BehaviorCompiler {
  compile(context: StructuredContext): Promise<BehaviorDefinition>;
}

interface BehaviorDefinition {
  role: string;              // AI persona ("Expert React Developer")
  objectives: string[];      // What to accomplish
  rules: string[];          // Hard constraints
  execution_style: string;   // How to approach tasks
  output_format: string;     // Expected response format
}
```

**Stage 4: Execution/Export**

For instruction files: Render to Markdown with target-specific formatting
For workflows: Generate step graph with dependencies

### 9.4 Quality Scoring System

**Six Dimensions**:

```typescript
interface QualityScore {
  correctness: number;      // Factually accurate?
  specificity: number;      // Detailed enough to execute?
  executability: number;    // Can actually be implemented?
  safety: number;          // No harmful/insecure patterns?
  compatibility: number;   // Fits existing codebase?
  brevity: number;        // Not unnecessarily verbose?
  aggregate: number;      // Weighted average
}
```

**Validation Gates**:
- Score < 60: Regenerate with feedback
- Score 60-80: Show warnings, allow proceed
- Score 80+: Green light

### 9.5 Data Model

**Entity Relationship Diagram**:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     User        │       │     Vibe        │       │    Workflow     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ email           │◄─────│ user_id (FK)    │       │ user_id (FK)    │
│ tier            │       │ name            │       │ name            │
│ created_at      │       │ description     │       │ intent          │
└─────────────────┘       │ context (JSON)  │       │ context (JSON)  │
                          │ is_built_in     │       │ steps (JSON)    │
                          │ created_at      │       │ quality_score   │
                          └─────────────────┘       │ created_at      │
                                                    └─────────────────┘
                              │                            │
                              │       ┌────────────────────┘
                              │       │
                              ▼       ▼
                         ┌─────────────────┐
                         │  Instruction    │
                         ├─────────────────┤
                         │ id (PK)         │
                         │ workflow_id(FK) │
                         │ target_format   │
                         │ content         │
                         │ downloaded_at   │
                         └─────────────────┘
```

### 9.6 Security Architecture

**Threat Model**:

| Threat | Mitigation |
|--------|------------|
| API key exposure | Environment variables only, never logged |
| Prompt injection | Input validation, output sanitization |
| Model provider breach | No persistent storage of user code/intent |
| Local LLM exposure | Bind to localhost only, no external access |
| Code injection in workflows | Sandboxed execution (planned) |

**Data Handling**:
- User intent: Ephemeral, session-only unless explicitly saved
- Workflows: User-controlled persistence (localStorage/export)
- Vibes: SQLite with encryption at rest (future)

---

## 10. Risk Analysis

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Model API Changes** | High | Medium | AICC abstraction, provider fallback |
| **LLM Output Quality** | Medium | High | Quality scoring, human-in-the-loop, retry logic |
| **Scalability Issues** | Medium | High | Edge deployment, caching, rate limiting |
| **Local LLM Complexity** | Medium | Low | Clear requirements, graceful degradation |

### 10.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Big Tech Competition** | High | High | Focus on multi-provider, export-first, community |
| **API Cost Volatility** | Medium | Medium | Tier-based routing, caching, local LLM option |
| **Slow User Adoption** | Medium | High | Free tier, viral templates, content marketing |
| **Enterprise Sales Cycle** | High | Medium | Land-and-expand, self-serve first |

### 10.3 Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **AI Model Convergence** | Medium | Medium | Position as orchestration layer, not model-specific |
| **IDE Incumbents** | High | High | Partner vs. compete, open standards advocacy |
| **Economic Downturn** | Medium | High | Cost-saving value prop, efficiency focus |
| **Regulatory Changes** | Low | High | Privacy-first design, export control compliance |

### 10.4 Mitigation Strategies

1. **Technical Diversification**: Never rely on single provider or model
2. **Community Moat**: Build template ecosystem with network effects
3. **Open Standards**: Advocate for portable instruction formats
4. **Cost Discipline**: Maintain 75%+ gross margins through intelligent routing
5. **Revenue Diversification**: SaaS + marketplace + API to reduce dependency

---

## 11. Success Metrics

### 11.1 North Star Metric

**Intent Compiles per Week**: Total successful compilations across all users
- **Target**: 10,000/week by end of Year 1
- **Why**: Direct measure of core value delivery

### 11.2 Key Performance Indicators

#### Acquisition
| Metric | Target (Y1) | Target (Y2) |
|--------|-------------|-------------|
| Website Visitors | 50,000/mo | 500,000/mo |
| Signups | 10,000 | 100,000 |
| Activation (first compile) | 60% | 70% |

#### Engagement
| Metric | Target (Y1) | Target (Y2) |
|--------|-------------|-------------|
| Weekly Active Users | 3,000 | 30,000 |
| Compiles per User/Week | 3 | 5 |
| Workflow Executions | 500/week | 10,000/week |
| Vibe Template Usage | 30% of compiles | 40% of compiles |

#### Retention
| Metric | Target (Y1) | Target (Y2) |
|--------|-------------|-------------|
| Week-1 Retention | 40% | 50% |
| Month-1 Retention | 25% | 35% |
| Month-12 Retention | 15% | 25% |

#### Revenue
| Metric | Target (Y1) | Target (Y2) |
|--------|-------------|-------------|
| Free-to-Paid Conversion | 5% | 8% |
| Average Revenue Per User | $180 | $220 |
| Net Revenue Retention | 100% | 110% |
| Gross Margin | 60% | 75% |

#### Quality
| Metric | Target |
|--------|--------|
| Compile Success Rate | >95% |
| Average Quality Score | >75/100 |
| User Satisfaction (NPS) | >40 |
| Support Tickets per User | <0.1/month |

### 11.3 Leading Indicators

- **Template Creation**: Users creating custom vibes (signals investment)
- **Workflow Sharing**: Users sharing workflows with team (signals collaboration)
- **API Usage**: Third-party integrations (signals platform value)
- **Quality Score Improvement**: Increasing output quality over time (signals product improvement)

---

## 12. Future Vision

### 12.1 The 3-Year Vision (2028)

**Intent Compiler is the standard toolchain for AI-assisted development.**

Every AI-native developer has Intent Compiler in their workflow:
- **Individuals** use it to bootstrap projects and maintain consistent AI context
- **Teams** use it to standardize development practices and onboard new members
- **Enterprises** use it to govern AI usage, ensure compliance, and optimize costs

**Key Achievements**:
- 1M+ developers using the platform
- 10,000+ community-contributed vibe templates
- Standard export format adopted by major AI assistants
- $50M ARR with path to profitability

### 12.2 The 5-Year Vision (2030)

**Intent Compiler evolves from a development tool to an intent infrastructure platform.**

The concepts of "compiling intent" extend beyond software development:
- **Business Operations**: Workflow generation for ops, finance, HR
- **Creative Industries**: Intent-to-design, intent-to-content
- **Scientific Research**: Hypothesis-to-experiment design
- **Personal Productivity**: Goal-to-action-plan for life management

**The platform becomes**:  
The universal bridge between human intent and AI execution across all domains.

### 12.3 Research & Innovation Areas

#### Near-Term (1-2 years)
- **Structured Generation**: Guarantee valid JSON/workflow structures via constrained decoding
- **Multi-Modal Intent**: Incorporate diagrams, mockups, voice as intent inputs
- **Feedback Loop Learning**: Improve compilation based on user corrections
- **Cost Optimization**: Dynamic model selection based on real-time pricing

#### Mid-Term (2-3 years)
- **Agent Orchestration**: Coordinate multiple specialized AI agents
- **Knowledge Graph Construction**: Build persistent project knowledge bases
- **Semantic Code Search**: Intent-based code retrieval and reuse
- **Predictive Compilation**: Anticipate user needs based on project state

#### Long-Term (3-5 years)
- **Autonomous Development**: Self-driving project completion with human oversight
- **Cross-Domain Compilation**: Apply intent compilation to non-software domains
- **Neural-Symbolic Integration**: Combine LLM reasoning with formal verification
- **Collective Intelligence**: Learn from global compilation patterns to improve for all

### 12.4 Strategic Partnerships Vision

**2027**: Native integration in 3+ major IDEs  
**2028**: Standard export format adopted by AI providers  
**2029**: University curricula teaching "Intent-Driven Development"  
**2030**: Intent Compiler concepts in ISO standards for AI-assisted engineering

### 12.5 Exit Opportunities

| Path | Likelihood | Timeline | Rationale |
|------|------------|----------|-----------|
| **IPO** | Low | 2029+ | Requires $100M+ ARR, market conditions |
| **Strategic Acquisition** | Medium | 2027-2028 | GitHub, Vercel, or AI lab seeking workflow tools |
| **Private Equity** | Low | 2028+ | Cash flow positive, growth slowing |
| **Stay Independent** | High | Ongoing | Sustainable business, mission-driven |

**Preferred Outcome**: Build a sustainable, independent company that defines the category.

---

## 13. Appendices

### Appendix A: Complete Feature Specifications

#### A.1 Instruction File Formats

**CLAUDE.md** (Anthropic Claude):
```markdown
# CLAUDE.md

## Role
{behavior.role}

## Project Context
- Project: {context.project}
- Audience: {context.audience}
- Tech Stack: {context.tech_stack}

## Objectives
{behavior.objectives}

## Rules
{behavior.rules}

## Guardrails
- DO NOT deviate from {context.tech_stack}
- ALWAYS verify against: {refinement.interpreted_intent}
```

**.cursorrules** (Cursor):
```markdown
# .cursorrules

## Context
{context.project} for {context.audience}

## Technology
{context.tech_stack}

## Coding Standards
{behavior.rules}

## Workflow
- Create PLAN.md for complex tasks
- Follow {behavior.execution_style}
```

**.windsurfrules** (Windsurf):
```markdown
# Windsurf Rules

## Project
{context.project}

## Stack
{context.tech_stack}

## Approach
{behavior.execution_style}

## Output
{behavior.output_format}
```

**AGENTS.md** (Generic):
```markdown
# AGENTS.md

## Agent Role
{behavior.role}

## Mission
{refinement.clarified_goal}

## Context
{context}

## Constraints
{context.constraints}

## Behavior
{behavior}
```

### Appendix B: API Reference

#### B.1 Endpoints

**POST /api/compilation/compile**
```typescript
Request: {
  intent: string;
  context: UserContext;
  modelConfig?: Partial<ModelConfig>;
}

Response: {
  workflow: Workflow;
  quality: QualityScore;
  modelConfig: ModelConfig;
}
```

**POST /api/compilation/compile-instruction**
```typescript
Request: {
  intent: string;
  context: UserContext;
  target: InstructionTarget;
  modelConfig?: Partial<ModelConfig>;
}

Response: {
  refinement: IntentRefinement;
  structuredContext: StructuredContext;
  behavior: BehaviorDefinition;
  markdown: string;
  quality: QualityScore;
  modelConfig: ModelConfig;
}
```

**POST /api/suggestions**
```typescript
Request: {
  intent: string;
  modelConfig?: Partial<ModelConfig>;
}

Response: {
  suggestions: {
    project: string[];
    audience: string[];
    style: string[];
    tone: string[];
    constraints: string[];
  };
  modelConfig: ModelConfig;
}
```

### Appendix C: Vibe Template Library

#### C.1 Built-in Templates (17)

**Frontend Development**:
- Shadcn Vibe (Next.js + Tailwind + Shadcn/UI)
- T3 Stack (Next.js + tRPC + Prisma + Tailwind)
- React Native Expo
- Vue Nuxt Fullstack

**Backend Development**:
- Python FastAPI (async, type-hinted)
- Node.js Express + TypeScript
- Go Microservices
- Rust Axum

**Data & AI**:
- Python Data Science (pandas, Jupyter)
- ML Engineering (PyTorch, MLflow)
- Agentic AI (LangChain, Vector DB)
- Vector RAG Pipeline

**Infrastructure**:
- DevOps Platform (Terraform, K8s)
- Event-Driven Microservices (Kafka)
- Serverless AWS (Lambda, DynamoDB)

**Enterprise**:
- Enterprise SaaS (Multi-tenant, RBAC)
- FinTech Platform (Compliance, Security)
- E-commerce Engine (Inventory, Payments)

**Emerging**:
- MCP Native App (Model Context Protocol)
- LLM-Native Backend (Streaming, structured gen)
- Autonomous Dev Agent

### Appendix D: Team Structure

#### D.1 Current Team (Bootstrap Phase)

| Role | Responsibility | Allocation |
|------|----------------|------------|
| **Founder/CEO** | Vision, fundraising, partnerships | 100% |
| **Founding Engineer** | Core architecture, AICC, compilation engine | 100% |
| **Design Contractor** | UI/UX, brand, visual design | 20% |

#### D.2 Seed Phase Team (Q3 2026)

| Role | Hire Priority | Responsibility |
|------|---------------|----------------|
| **Full-Stack Engineer** | P0 | Workflow execution, API development |
| **AI/ML Engineer** | P0 | Model optimization, quality scoring |
| **Frontend Engineer** | P1 | UI components, IDE integrations |
| **DevOps Engineer** | P1 | Infrastructure, scaling, security |
| **Community Manager** | P2 | Content, support, template curation |

#### D.3 Series A Team (2027)

| Function | Headcount |
|----------|-----------|
| Engineering | 8 |
| Product/Design | 3 |
| Growth/Marketing | 4 |
| Customer Success | 2 |
| Operations | 2 |
| **Total** | **19** |

### Appendix E: Development Roadmap (Detailed)

#### E.1 Q2 2026 (Current)

**Sprint 1-2: Foundation**
- [x] AICC provider abstraction
- [x] Intent refinement pipeline
- [x] Basic instruction generation
- [x] Quality scoring

**Sprint 3-4: UX Polish**
- [x] Vibe mode UI
- [x] Model selection interface
- [x] Export preview
- [x] Project auto-detection

**Sprint 5-6: Workflow MVP**
- [ ] Workflow generation API
- [ ] Basic execution UI
- [ ] Step validation
- [ ] Session persistence

#### E.2 Q3 2026 (Execution Engine)

**Month 1: Core Execution**
- Workflow dependency resolution
- Parallel step execution
- Rollback mechanism

**Month 2: Human-in-the-Loop**
- Pause/resume functionality
- Step editing mid-workflow
- Approval gates

**Month 3: Team Features**
- Workflow sharing
- Team workspaces
- Permission model

#### E.3 Q4 2026 (Project Generation)

**Month 1: Scaffolding**
- Full project generation
- Dependency installation
- Git initialization

**Month 2: Patterns**
- Architecture templates
- Testing setup
- Documentation generation

**Month 3: Launch**
- Product Hunt launch
- Public beta
- Paid tier introduction

### Appendix F: Glossary

| Term | Definition |
|------|------------|
| **AICC** | AI Control Center — unified LLM provider interface |
| **Behavior Definition** | Structured AI persona specification |
| **Compile** | Transform intent into executable form |
| **Intent** | High-level natural language goal |
| **Instruction File** | Platform-specific AI guidance document |
| **Provider** | LLM service (Groq, OpenRouter, etc.) |
| **Quality Score** | 6-dimensional output evaluation |
| **Refinement** | LLM-based intent clarification |
| **Step** | Single unit of work in a workflow |
| **Tier** | Model capability classification |
| **Vibe** | Pre-configured project template |
| **Workflow** | Multi-step execution plan with dependencies |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-03 | Cascade | Initial technical reference |
| 1.0.0 | 2026-03 | Cascade | Complete project proposal expansion |

---

## Document Usage

**For Investors**: Sections 1, 3, 4, 6, 7, 10, 12  
**For Developers**: Sections 2, 5, 9, Appendices A-C  
**For Partners**: Sections 1, 3, 8, 12  
**For Team**: Entire document  

---

*This document is a living artifact. Update as strategy evolves, market conditions change, and new opportunities emerge.*

**End of Document**
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
