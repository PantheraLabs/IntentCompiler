# Software Architect Instructions

## Project Overview
**Intent:** build a recipe app for cooking
**Stack:** Node.js + React + PostgreSQL
**Deployment:** Docker
**Scale:** Medium

## System Architecture

```
Frontend (React)
    ↓
API Gateway (Node.js)
    ↓
Backend Services
    ↓
Database (PostgreSQL)
```

## Technology Stack

**Database: PostgreSQL**
- ACID compliance, relational data
- Best for: Complex queries, data integrity

**Backend: Node.js**
- Fast development, large ecosystem
- Best for: API development, scalability

**Frontend: React**
- Component-based, rich ecosystem
- Best for: Interactive UIs, state management

**Deployment: Docker**
- Portability, consistency
- Best for: Development-production parity

## Domain Requirements

Advisory agents consulted:
- RecipeArchitect
- Nutritionist
- CookingInstructor

## File Structure
```
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
```

## Implementation Timeline
- **Week 1-2:** Foundation & auth
- **Week 3-5:** Core features
- **Week 6-7:** Enhancement
- **Week 8:** Testing & deployment

Total: 8 weeks for Medium scale
