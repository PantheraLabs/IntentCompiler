#!/usr/bin/env node

/**
 * IntentCompiler Multi-Mode Instruction File Generator
 * Generates DETAILED, AI-PROMPTS, and QUICK-START instruction files
 */

const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const readline = require('readline');

// ============================================
// DOMAIN DETECTOR
// ============================================

class DomainDetector {
  detectPrimaryDomain(intent) {
    const lower = intent.toLowerCase();
    if (lower.includes('build') || lower.includes('app') || lower.includes('create')) {
      return 'software_development';
    }
    return 'general';
  }

  detectSecondaryDomain(intent) {
    const lower = intent.toLowerCase();
    if (lower.includes('recipe') || lower.includes('food') || lower.includes('cooking')) return 'food';
    if (lower.includes('delivery') || lower.includes('swiggy')) return 'delivery';
    if (lower.includes('finance') || lower.includes('trading')) return 'finance';
    return 'general';
  }

  selectAdvisoryAgents(domain) {
    const agents = {
      'food': ['RecipeArchitect', 'Nutritionist', 'CookingInstructor'],
      'delivery': ['RestaurantOps', 'LogisticsSpecialist', 'FoodSafety'],
      'finance': ['FinancialAdvisor', 'ComplianceExpert'],
      'general': []
    };
    return agents[domain] || [];
  }
}

// ============================================
// CONTEXT GATHERER
// ============================================

class ContextGatherer {
  async gather(rl) {
    console.log(`\n📋 Context Gathering`);
    console.log(`${'='.repeat(60)}`);
    
    const database = await this.ask(rl, '🗄️  Database [PostgreSQL]: ') || 'PostgreSQL';
    const backend = await this.ask(rl, '⚙️  Backend [Node.js]: ') || 'Node.js';
    const frontend = await this.ask(rl, '🎨 Frontend [React]: ') || 'React';
    const deployment = await this.ask(rl, '☁️  Deployment [Docker]: ') || 'Docker';
    const scale = await this.ask(rl, '📊 Scale [Medium]: ') || 'Medium';
    
    return { database, backend, frontend, deployment, scale };
  }

  ask(rl, question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
  }
}

// ============================================
// FILE GENERATOR
// ============================================

class FileGenerator {
  constructor() {
    this.outputDir = 'output';
  }

  createFolder(intent) {
    const timestamp = new Date().toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-');
    
    const sanitized = intent.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 30);
    
    const folderPath = join(this.outputDir, `${timestamp}_${sanitized}`);
    
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
    mkdirSync(folderPath, { recursive: true });
    
    return folderPath;
  }

  generateAll(folderPath, intent, context, advisoryAgents) {
    console.log(`\n📁 Generating instruction files in all three modes...`);
    
    // Create mode folders
    const detailed = join(folderPath, 'detailed');
    const aiPrompts = join(folderPath, 'ai-prompts');
    const quickstart = join(folderPath, 'quickstart');
    
    [detailed, aiPrompts, quickstart].forEach(dir => {
      mkdirSync(dir, { recursive: true });
    });
    
    // Generate DETAILED mode
    this.generateDetailed(detailed, intent, context, advisoryAgents);
    
    // Generate AI-PROMPTS mode
    this.generateAIPrompts(aiPrompts, intent, context, advisoryAgents);
    
    // Generate QUICK-START mode
    this.generateQuickStart(quickstart, intent, context);
    
    // Generate README
    this.generateREADME(folderPath, intent, context, advisoryAgents);
    
    console.log(`✅ All modes generated successfully!`);
    console.log(`📂 Location: ${folderPath}`);
  }

  generateDetailed(path, intent, context, advisoryAgents) {
    const advisoryDir = join(path, 'advisory');
    const technicalDir = join(path, 'technical');
    
    mkdirSync(advisoryDir, { recursive: true });
    mkdirSync(technicalDir, { recursive: true });
    
    // Advisory files
    advisoryAgents.forEach(agent => {
      const content = this.getAdvisoryContent(agent, intent, context);
      writeFileSync(join(advisoryDir, `${agent}_requirements.md`), content);
    });
    
    // Technical files
    const technicalAgents = ['SoftwareArchitect', 'BackendDeveloper', 'FrontendDeveloper', 'DevOpsEngineer'];
    technicalAgents.forEach(agent => {
      const content = this.getTechnicalContent(agent, intent, context, advisoryAgents);
      writeFileSync(join(technicalDir, `${agent}_instructions.md`), content);
    });
    
    console.log(`  ✓ DETAILED mode (${advisoryAgents.length + technicalAgents.length} files)`);
  }

  generateAIPrompts(path, intent, context, advisoryAgents) {
    const prompts = [
      { file: '01_architecture.txt', content: this.getArchitecturePrompt(intent, context, advisoryAgents) },
      { file: '02_backend.txt', content: this.getBackendPrompt(intent, context, advisoryAgents) },
      { file: '03_frontend.txt', content: this.getFrontendPrompt(intent, context) },
      { file: '04_deployment.txt', content: this.getDeploymentPrompt(intent, context) }
    ];
    
    prompts.forEach(({ file, content }) => {
      writeFileSync(join(path, file), content);
    });
    
    console.log(`  ✓ AI-PROMPTS mode (${prompts.length} files)`);
  }

  generateQuickStart(path, intent, context) {
    const quickstart = this.getQuickStartContent(intent, context);
    const checklist = this.getChecklistContent(intent, context);
    
    writeFileSync(join(path, 'QUICKSTART.md'), quickstart);
    writeFileSync(join(path, 'CHECKLIST.md'), checklist);
    
    console.log(`  ✓ QUICK-START mode (2 files)`);
  }

  generateREADME(path, intent, context, advisoryAgents) {
    const content = `# IntentCompiler Output

**Generated:** ${new Date().toISOString()}
**Intent:** ${intent}

## 📊 Project Configuration

- **Database:** ${context.database}
- **Backend:** ${context.backend}
- **Frontend:** ${context.frontend}
- **Deployment:** ${context.deployment}
- **Scale:** ${context.scale}

## 🤖 Agents Used

### Technical Agents (4)
- SoftwareArchitect - System design & architecture
- BackendDeveloper - API & business logic
- FrontendDeveloper - UI/UX implementation
- DevOpsEngineer - Deployment & infrastructure

### Advisory Agents (${advisoryAgents.length})
${advisoryAgents.map(a => `- ${a} - Domain expertise`).join('\n')}

## 📁 Output Modes

### 1. DETAILED (detailed/)
Comprehensive instruction files (20+ pages each) with:
- Complete database schemas
- Full API specifications
- Detailed implementation steps
- Code examples and best practices

**Use for:** Thorough planning and understanding

### 2. AI-PROMPTS (ai-prompts/)
Sequential prompts ready for AI IDEs:
- 01_architecture.txt
- 02_backend.txt
- 03_frontend.txt
- 04_deployment.txt

**Use for:** Copy-paste into Cursor/Windsurf/Copilot

### 3. QUICK-START (quickstart/)
Fast implementation guide:
- QUICKSTART.md - Essential steps with timelines
- CHECKLIST.md - Implementation checklist

**Use for:** Experienced developers who want to start quickly

## 🚀 Getting Started

Choose the mode that fits your workflow:

**Researcher/Planner:** Start with \`detailed/\` folder
**AI-IDE User:** Use \`ai-prompts/\` sequentially
**Quick Builder:** Follow \`quickstart/QUICKSTART.md\`

---

*Generated by IntentCompiler Multi-Agent System*
`;
    
    writeFileSync(join(path, 'README.md'), content);
    console.log(`  ✓ README.md`);
  }

  // Content generators
  getAdvisoryContent(agent, intent, context) {
    const templates = {
      'RecipeArchitect': `# Recipe Architect Requirements

## Recipe Data Structure

### Core Fields
- Title, Description
- Prep Time, Cook Time, Total Time
- Servings, Difficulty Level
- Cuisine Type, Dietary Tags

### Ingredient Organization
1. **Main Ingredients** - Primary components
2. **Secondary Ingredients** - Supporting items
3. **Seasonings** - Spices and herbs
4. **Garnish** - Final touches

### Cooking Flow
Prep → Cook → Plate → Serve

### Database Schema
\`\`\`sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty VARCHAR(20),
  cuisine_type VARCHAR[],
  dietary_tags VARCHAR[]
);

CREATE TABLE recipe_ingredients (
  recipe_id UUID REFERENCES recipes(id),
  ingredient_id UUID,
  quantity DECIMAL,
  unit VARCHAR(50),
  category VARCHAR(50)
);
\`\`\`

### Key Requirements
- Scalable servings (2x, 0.5x)
- Search by ingredients
- Filter by dietary restrictions
- Save favorites
- Rate and review

This structure ensures recipes are practical and user-friendly.`,

      'Nutritionist': `# Nutritionist Requirements

## Nutritional Data

### Macronutrients (Per Serving)
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
  - Fiber (g)
  - Sugar (g)
- Fat (g)
  - Saturated (g)
  - Unsaturated (g)

### Micronutrients
- Vitamins: A, C, D, E, K, B-complex
- Minerals: Iron, Calcium, Potassium, Sodium

### Dietary Compatibility
- Vegetarian, Vegan
- Gluten-Free, Dairy-Free
- Keto-Friendly, Paleo

### Database Schema
\`\`\`sql
CREATE TABLE recipe_nutrition (
  recipe_id UUID REFERENCES recipes(id),
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  fiber DECIMAL,
  dietary_tags VARCHAR[]
);
\`\`\`

### Features
- Filter by calorie range
- Search by nutritional goals
- Track daily nutrition
- View health benefits`,

      'CookingInstructor': `# Cooking Instructor Requirements

## Instruction Format

### Step Structure
- Step Number
- Phase (Prep/Cook/Plate/Serve)
- Instruction (clear, action-oriented)
- Duration (minutes)
- Temperature (if applicable)
- Technique
- Visual Cue

### Example
\`\`\`
Step 3 (Cook):
"Heat olive oil over medium heat (350°F). 
Add onions and sauté 5-7 minutes until golden."

Technique: Sautéing
Visual Cue: Translucent and caramelized
Equipment: Large skillet, wooden spoon
\`\`\`

### Database Schema
\`\`\`sql
CREATE TABLE recipe_steps (
  recipe_id UUID REFERENCES recipes(id),
  step_number INTEGER,
  phase VARCHAR(20),
  instruction TEXT,
  duration_minutes INTEGER,
  temperature VARCHAR(50),
  technique VARCHAR(100)
);
\`\`\`

### Features
- Step-by-step cooking mode
- Timer integration
- Technique glossary
- Equipment substitutions`
    };
    
    return templates[agent] || `# ${agent} Requirements\n\nDomain-specific requirements for ${intent}.`;
  }

  getTechnicalContent(agent, intent, context, advisoryAgents) {
    const advisoryList = advisoryAgents.map(a => `- ${a}`).join('\n');
    
    if (agent === 'SoftwareArchitect') {
      return `# Software Architect Instructions

## Project Overview
**Intent:** ${intent}
**Stack:** ${context.backend} + ${context.frontend} + ${context.database}
**Deployment:** ${context.deployment}
**Scale:** ${context.scale}

## System Architecture

\`\`\`
Frontend (${context.frontend})
    ↓
API Gateway (${context.backend})
    ↓
Backend Services
    ↓
Database (${context.database})
\`\`\`

## Technology Stack

**Database: ${context.database}**
- ACID compliance, relational data
- Best for: Complex queries, data integrity

**Backend: ${context.backend}**
- Fast development, large ecosystem
- Best for: API development, scalability

**Frontend: ${context.frontend}**
- Component-based, rich ecosystem
- Best for: Interactive UIs, state management

**Deployment: ${context.deployment}**
- Portability, consistency
- Best for: Development-production parity

## Domain Requirements

Advisory agents consulted:
${advisoryList}

## File Structure
\`\`\`
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   └── models/
│   └── package.json
└── infrastructure/
    ├── docker/
    └── scripts/
\`\`\`

## Implementation Timeline
- **Week 1-2:** Foundation & auth
- **Week 3-5:** Core features
- **Week 6-7:** Enhancement
- **Week 8:** Testing & deployment

Total: 8 weeks for ${context.scale} scale
`;
    }
    
    if (agent === 'BackendDeveloper') {
      return `# Backend Developer Instructions

## Technology Stack
- Runtime: ${context.backend} 20.x
- Framework: Express.js 4.x
- Database: ${context.database} 15
- ORM: Prisma
- Auth: JWT + bcrypt

## Database Schema

\`\`\`sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Domain-specific tables
-- (See advisory requirements for detailed schema)
\`\`\`

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh

### Core Business
- GET /api/items
- POST /api/items
- GET /api/items/:id
- PUT /api/items/:id
- DELETE /api/items/:id

## File Structure
\`\`\`
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   └── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   └── index.ts
├── tests/
└── package.json
\`\`\`

## Implementation Steps
1. **Day 1:** Project setup
2. **Day 1-2:** Database schema
3. **Day 2-3:** Authentication
4. **Day 4-7:** Core API
5. **Day 8-9:** Testing
6. **Day 10:** Optimization

Total: 10 days

## Security Checklist
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] Password hashing (bcrypt)
- [ ] JWT expiration
- [ ] Rate limiting
- [ ] HTTPS only
`;
    }
    
    if (agent === 'FrontendDeveloper') {
      return `# Frontend Developer Instructions

## Technology Stack
- Framework: ${context.frontend} 18.x
- Meta-framework: Next.js 14.x
- Styling: Tailwind CSS
- State: Zustand
- Forms: React Hook Form + Zod

## Project Structure
\`\`\`
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   └── (dashboard)/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── features/
│   ├── hooks/
│   ├── lib/
│   └── store/
└── package.json
\`\`\`

## Key Components

### Authentication
\`\`\`tsx
// LoginForm.tsx
'use client';
import { useForm } from 'react-hook-form';

export function LoginForm() {
  const { register, handleSubmit } = useForm();
  
  const onSubmit = async (data) => {
    // API call
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      <input {...register('password')} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
\`\`\`

### Layout
- Header with navigation
- Sidebar (optional)
- Footer
- Responsive design

## Implementation Steps
1. **Day 1:** Project setup
2. **Day 2:** Layout components
3. **Day 3:** Authentication UI
4. **Day 4-7:** Core features
5. **Day 8-9:** Polish
6. **Day 10:** Testing

Total: 10 days

## Performance
- Code splitting
- Image optimization
- Lazy loading
- Caching
`;
    }
    
    if (agent === 'DevOpsEngineer') {
      return `# DevOps Engineer Instructions

## Deployment Strategy
**Platform:** ${context.deployment}
**Scale:** ${context.scale}

## Docker Configuration

### docker-compose.yml
\`\`\`yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: postgresql://appuser:\${DB_PASSWORD}@postgres:5432/appdb
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000/api
    depends_on:
      - backend

volumes:
  postgres_data:
\`\`\`

## CI/CD Pipeline

### GitHub Actions
\`\`\`yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker-compose up -d
\`\`\`

## Environment Variables
\`\`\`bash
DB_PASSWORD=change_in_production
JWT_SECRET=use_long_random_string
API_URL=http://localhost:3000
\`\`\`

## Implementation Timeline
- **Week 1:** Infrastructure setup
- **Week 2:** Deployment & monitoring

Total: 2 weeks
`;
    }
    
    return `# ${agent} Instructions\n\nDetailed instructions for ${intent}.`;
  }

  getArchitecturePrompt(intent, context, advisoryAgents) {
    return `Create a ${context.backend} + ${context.frontend} application architecture for: "${intent}"

Requirements:
- Database: ${context.database} with proper schema design
- Backend: ${context.backend} with RESTful API
- Frontend: ${context.frontend} with modern UI/UX
- Deployment: ${context.deployment} with CI/CD
- Scale: ${context.scale}

Domain requirements from experts:
${advisoryAgents.map(a => `- ${a}`).join('\n')}

Include:
1. Complete project structure
2. Technology stack with versions
3. Database schema with relationships
4. API endpoint list
5. Security considerations
6. Scalability strategy`;
  }

  getBackendPrompt(intent, context, advisoryAgents) {
    return `Build a ${context.backend} backend API for: "${intent}"

Tech stack:
- Runtime: ${context.backend}
- Database: ${context.database}
- ORM: Prisma
- Auth: JWT

Create:
1. Complete database schema with relationships
2. RESTful API endpoints (CRUD operations)
3. Authentication & authorization
4. Input validation & error handling
5. Business logic incorporating domain expertise

Include file structure, API definitions, and testing strategy.`;
  }

  getFrontendPrompt(intent, context) {
    return `Build a ${context.frontend} frontend for: "${intent}"

Tech stack:
- Framework: ${context.frontend} + Next.js 14
- Styling: Tailwind CSS
- State: Zustand
- Forms: React Hook Form + Zod

Create:
1. Complete component structure
2. Authentication UI (login, register)
3. Main dashboard/listing pages
4. Create/edit forms
5. Responsive design (mobile-first)

Include component hierarchy, state management, and API integration.`;
  }

  getDeploymentPrompt(intent, context) {
    return `Set up deployment infrastructure for: "${intent}"

Platform: ${context.deployment}
Scale: ${context.scale}

Create:
1. Docker configuration (Dockerfile + docker-compose.yml)
2. CI/CD pipeline (GitHub Actions)
3. Environment configuration
4. Nginx reverse proxy
5. SSL/TLS setup
6. Monitoring and logging
7. Backup strategy

Include security best practices and scaling strategy.`;
  }

  getQuickStartContent(intent, context) {
    return `# Quick Start Guide

**Intent:** ${intent}
**Stack:** ${context.backend} + ${context.frontend} + ${context.database}

## Setup (1 hour)

### 1. Backend (30 min)
\`\`\`bash
cd backend
npm init -y
npm install express prisma @prisma/client bcrypt jsonwebtoken
npx prisma init
# Edit schema.prisma
npx prisma migrate dev
npm start
\`\`\`

### 2. Frontend (30 min)
\`\`\`bash
npx create-next-app@latest frontend --typescript --tailwind
cd frontend
npm install zustand react-hook-form zod axios
npm run dev
\`\`\`

## Development Timeline

**Week 1-2: Foundation**
- Database schema
- Authentication
- Basic CRUD

**Week 3-5: Core Features**
- Business logic
- UI components
- API integration

**Week 6-7: Enhancement**
- Caching
- Optimization
- Testing

**Week 8: Deployment**
- Docker setup
- CI/CD
- Production deploy

**Total: 8 weeks**

## Key Files to Create

1. \`backend/src/index.ts\` - Server entry point
2. \`backend/prisma/schema.prisma\` - Database schema
3. \`frontend/src/app/page.tsx\` - Home page
4. \`docker-compose.yml\` - Container orchestration

## Next Steps

1. Read detailed instructions in \`detailed/\` folder
2. Or use AI prompts in \`ai-prompts/\` folder
3. Follow implementation checklist
`;
  }

  getChecklistContent(intent, context) {
    return `# Implementation Checklist

## Phase 1: Setup
- [ ] Initialize backend project
- [ ] Initialize frontend project
- [ ] Set up database
- [ ] Configure environment variables
- [ ] Create Git repository

## Phase 2: Backend
- [ ] Database schema created
- [ ] User authentication implemented
- [ ] Core API endpoints working
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Tests written

## Phase 3: Frontend
- [ ] Project structure created
- [ ] Layout components built
- [ ] Authentication UI completed
- [ ] Main pages implemented
- [ ] Forms with validation
- [ ] API integration working

## Phase 4: Integration
- [ ] Frontend connects to backend
- [ ] Authentication flow works
- [ ] CRUD operations functional
- [ ] Error handling in place
- [ ] Loading states added

## Phase 5: Polish
- [ ] Responsive design tested
- [ ] Performance optimized
- [ ] Accessibility checked
- [ ] Code reviewed
- [ ] Documentation updated

## Phase 6: Deployment
- [ ] Docker configuration created
- [ ] CI/CD pipeline set up
- [ ] Environment variables configured
- [ ] Deployed to staging
- [ ] Tested in staging
- [ ] Deployed to production

## Phase 7: Post-Launch
- [ ] Monitoring set up
- [ ] Logs configured
- [ ] Backup strategy in place
- [ ] Team trained
- [ ] Documentation complete
`;
  }
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

class IntentCompilerOrchestrator {
  constructor() {
    this.domainDetector = new DomainDetector();
    this.contextGatherer = new ContextGatherer();
    this.fileGenerator = new FileGenerator();
  }

  async run() {
    console.log(`\n🤖 IntentCompiler - Multi-Mode Instruction File Generator`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\nGenerates three output modes:`);
    console.log(`📋 DETAILED - Comprehensive instruction files`);
    console.log(`🤖 AI-PROMPTS - Ready for AI IDEs (Cursor/Windsurf)`);
    console.log(`⚡ QUICK-START - Fast implementation guide\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Get intent
      const intent = await new Promise(resolve => 
        rl.question('🎯 Enter your intent: ', answer => resolve(answer.trim()))
      );

      if (!intent) {
        console.log('❌ Intent is required');
        rl.close();
        return;
      }

      // Detect domains
      const primaryDomain = this.domainDetector.detectPrimaryDomain(intent);
      const secondaryDomain = this.domainDetector.detectSecondaryDomain(intent);
      const advisoryAgents = this.domainDetector.selectAdvisoryAgents(secondaryDomain);

      console.log(`\n🎯 Domain Detection:`);
      console.log(`   Primary: ${primaryDomain}`);
      console.log(`   Secondary: ${secondaryDomain}`);
      console.log(`   Advisory Agents: ${advisoryAgents.join(', ') || 'None'}`);

      // Gather context
      const context = await this.contextGatherer.gather(rl);
      
      rl.close();

      console.log(`\n✅ Configuration Complete`);
      console.log(`${'='.repeat(60)}`);

      // Generate files
      const folderPath = this.fileGenerator.createFolder(intent);
      this.fileGenerator.generateAll(folderPath, intent, context, advisoryAgents);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎉 SUCCESS! Instruction files generated`);
      console.log(`${'='.repeat(60)}`);
      console.log(`\n📂 Output location: ${folderPath}`);
      console.log(`\n📁 Generated modes:`);
      console.log(`   1. detailed/ - Comprehensive instructions`);
      console.log(`   2. ai-prompts/ - AI IDE prompts`);
      console.log(`   3. quickstart/ - Quick implementation guide`);
      console.log(`\n💡 Next steps:`);
      console.log(`   - Read README.md for overview`);
      console.log(`   - Choose mode based on your workflow`);
      console.log(`   - Start building!`);

    } catch (error) {
      console.error(`\n❌ Error:`, error.message);
      rl.close();
    }
  }
}

// ============================================
// RUN
// ============================================

if (require.main === module) {
  const orchestrator = new IntentCompilerOrchestrator();
  orchestrator.run().catch(console.error);
}

module.exports = { IntentCompilerOrchestrator };
