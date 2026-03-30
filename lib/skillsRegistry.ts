/**
 * Skills Registry - Manages AI skills for instruction generation
 * Skills are modular capabilities that enhance instruction quality
 */

import type { ComplexityLevel, ProjectType } from "./projectAnalyzer";

export interface Skill {
  name: string;
  description: string;
  complexity: ComplexityLevel | "all";
  domains: string[];
  projectTypes: ProjectType[];
  content: string;
  references?: string[];
  examples?: string[];
}

// Core skills for different project types and complexities

export const SKILLS_DATABASE: Skill[] = [
  // === WEB DEVELOPMENT SKILLS ===
  {
    name: "react-best-practices",
    description: "React component architecture, hooks patterns, and state management",
    complexity: "medium",
    domains: ["frontend"],
    projectTypes: ["webapp", "fullstack"],
    content: `## React Best Practices

### Component Architecture
- Use functional components with hooks
- Implement component composition over inheritance
- Keep components small and focused (single responsibility)
- Use TypeScript for type safety

### State Management
- Local state: useState for component-specific state
- Global state: Context API or Redux for shared state
- Server state: React Query or SWR for API data
- Form state: React Hook Form for complex forms

### Performance Patterns
- React.memo for expensive components
- useMemo/useCallback for expensive computations
- Code splitting with React.lazy
- Virtual lists for large datasets

### File Structure
\`\`\`
src/
├── components/     # Reusable UI components
├── features/       # Feature-specific components
├── hooks/          # Custom hooks
├── contexts/       # Context providers
├── services/       # API services
└── utils/          # Helper functions
\`\`\`
`
  },
  {
    name: "api-design-patterns",
    description: "RESTful API design, authentication, and error handling",
    complexity: "medium",
    domains: ["backend"],
    projectTypes: ["webapp", "fullstack", "api"],
    content: `## API Design Patterns

### RESTful Principles
- Use nouns for resources: /users, /products
- HTTP methods for actions: GET, POST, PUT, DELETE
- Proper status codes: 200, 201, 400, 401, 404, 500
- Consistent response structure

### Authentication
- JWT for stateless authentication
- Refresh tokens for security
- Rate limiting per user/token
- CORS configuration

### Error Handling
\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
\`\`\`

### Versioning
- URL versioning: /api/v1/resource
- Header versioning: Accept: application/vnd.api.v1+json
`
  },
  {
    name: "database-modeling",
    description: "Database schema design, relationships, and optimization",
    complexity: "medium",
    domains: ["database"],
    projectTypes: ["webapp", "fullstack"],
    content: `## Database Modeling

### Schema Design Principles
- Normalize to reduce redundancy (3NF typically)
- Denormalize for read performance when needed
- Use appropriate data types
- Index strategically

### Relationships
- One-to-One: Shared primary key or foreign key
- One-to-Many: Foreign key on "many" side
- Many-to-Many: Junction table

### MongoDB Patterns
- Embed for frequent access together
- Reference for large/infrequent data
- Use indexes for query optimization

### PostgreSQL Patterns
- Use JSONB for flexible schemas
- Implement soft deletes
- Add created_at/updated_at timestamps
`
  },

  // === ENTERPRISE SKILLS ===
  {
    name: "microservices-architecture",
    description: "Service decomposition, communication patterns, and distributed systems",
    complexity: "complex",
    domains: ["backend", "deployment"],
    projectTypes: ["fullstack"],
    content: `## Microservices Architecture

### Service Decomposition
- Domain-driven design (DDD) bounded contexts
- Single responsibility per service
- Database per service pattern
- API Gateway for routing

### Communication Patterns
- Synchronous: REST/GraphQL for queries
- Asynchronous: Message queues (RabbitMQ, Kafka) for events
- Service mesh (Istio) for complex routing

### Resilience Patterns
- Circuit breaker for failures
- Retry with exponential backoff
- Bulkhead for resource isolation
- Saga pattern for distributed transactions

### Observability
- Distributed tracing (Jaeger, Zipkin)
- Centralized logging (ELK stack)
- Metrics (Prometheus, Grafana)
`
  },
  {
    name: "authentication-security",
    description: "Authentication flows, authorization, and security best practices",
    complexity: "complex",
    domains: ["authentication"],
    projectTypes: ["webapp", "fullstack"],
    content: `## Authentication & Security

### Authentication Flows
- Email/Password: Hash with bcrypt/argon2
- OAuth 2.0: Google, GitHub, etc.
- MFA: TOTP (Time-based OTP)
- Passwordless: Magic links, WebAuthn

### JWT Implementation
- Access tokens: Short-lived (15-30 min)
- Refresh tokens: Long-lived, stored securely
- Token rotation on refresh
- Blacklist for logout/compromise

### Authorization
- Role-based access control (RBAC)
- Attribute-based access control (ABAC)
- Resource-based permissions

### Security Headers
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
`
  },

  // === SIMPLE PROJECT SKILLS ===
  {
    name: "static-website",
    description: "Simple static website structure and best practices",
    complexity: "simple",
    domains: ["frontend"],
    projectTypes: ["website"],
    content: `## Static Website Structure

### File Organization
\`\`\`
/
├── index.html          # Homepage
├── about.html          # About page
├── contact.html        # Contact page
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # Interactions
└── images/             # Optimized images
\`\`\`

### HTML Best Practices
- Semantic HTML5 elements
- Meta tags for SEO
- Responsive viewport meta
- Accessible forms

### CSS Guidelines
- Mobile-first approach
- CSS custom properties for theming
- Flexbox/Grid for layout
- Optimized for performance

### Performance
- Minify CSS/JS
- Optimize images (WebP, AVIF)
- Lazy load images
- Minimal dependencies
`
  },

  // === TESTING SKILLS ===
  {
    name: "testing-strategy",
    description: "Unit, integration, and E2E testing patterns",
    complexity: "medium",
    domains: ["testing"],
    projectTypes: ["webapp", "fullstack", "api"],
    content: `## Testing Strategy

### Testing Pyramid
- Unit Tests: 70% - Fast, isolated
- Integration Tests: 20% - API, database
- E2E Tests: 10% - Critical user flows

### Unit Testing
- Jest for JavaScript/TypeScript
- Test behavior, not implementation
- Mock external dependencies
- Aim for 80%+ coverage

### Integration Testing
- Test API endpoints with database
- Use test database
- Clean up between tests
- Test authentication flows

### E2E Testing
- Playwright or Cypress
- Test critical user journeys
- Run on CI/CD
- Visual regression for UI
`
  },

  // === DEPLOYMENT SKILLS ===
  {
    name: "deployment-ci-cd",
    description: "CI/CD pipelines, containerization, and deployment strategies",
    complexity: "medium",
    domains: ["deployment"],
    projectTypes: ["webapp", "fullstack", "api"],
    content: `## Deployment & CI/CD

### Containerization
\`\`\`dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
\`\`\`

### CI/CD Pipeline
- Lint and format check
- Unit and integration tests
- Build Docker image
- Deploy to staging
- Run E2E tests
- Deploy to production

### Deployment Strategies
- Blue-Green: Zero downtime
- Canary: Gradual rollout
- Rolling: Update instances gradually

### Environment Variables
- Use .env files locally
- Secrets in CI/CD or vault
- Never commit secrets
`
  }
];

/**
 * Get skills relevant to a project
 */
export function getRelevantSkills(
  projectType: ProjectType,
  complexity: ComplexityLevel,
  domains: string[]
): Skill[] {
  return SKILLS_DATABASE.filter(skill => {
    // Check complexity match
    if (skill.complexity !== "all" && skill.complexity !== complexity) {
      // Allow lower complexity skills for higher complexity projects
      const complexityOrder = ["simple", "medium", "complex"];
      const skillIndex = complexityOrder.indexOf(skill.complexity);
      const projectIndex = complexityOrder.indexOf(complexity);
      if (skillIndex > projectIndex) return false;
    }
    
    // Check project type match
    if (!skill.projectTypes.includes(projectType)) {
      return false;
    }
    
    // Check domain overlap
    const hasDomainOverlap = skill.domains.some(d => domains.includes(d));
    if (!hasDomainOverlap && skill.domains.length > 0) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get skill by name
 */
export function getSkillByName(name: string): Skill | undefined {
  return SKILLS_DATABASE.find(s => s.name === name);
}

/**
 * Get all skills for a domain
 */
export function getSkillsForDomain(domain: string): Skill[] {
  return SKILLS_DATABASE.filter(s => s.domains.includes(domain));
}

/**
 * Enhance instruction content with skills
 */
export function enhanceWithSkills(
  content: string,
  skills: Skill[]
): string {
  if (skills.length === 0) return content;
  
  let enhanced = content;
  
  // Add skill content as additional sections
  for (const skill of skills) {
    const sectionHeader = `\n\n## ${formatSkillName(skill.name)}\n\n`;
    if (!enhanced.includes(sectionHeader)) {
      enhanced += sectionHeader + skill.content;
    }
  }
  
  return enhanced;
}

/**
 * Format skill name for display
 */
function formatSkillName(name: string): string {
  return name
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
