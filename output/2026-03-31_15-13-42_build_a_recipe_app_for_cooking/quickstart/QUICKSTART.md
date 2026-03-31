# Quick Start Guide

**Intent:** build a recipe app for cooking
**Stack:** Node.js + React + PostgreSQL

## Setup (1 hour)

### 1. Backend (30 min)
```bash
cd backend
npm init -y
npm install express prisma @prisma/client bcrypt jsonwebtoken
npx prisma init
# Edit schema.prisma
npx prisma migrate dev
npm start
```

### 2. Frontend (30 min)
```bash
npx create-next-app@latest frontend --typescript --tailwind
cd frontend
npm install zustand react-hook-form zod axios
npm run dev
```

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

1. `backend/src/index.ts` - Server entry point
2. `backend/prisma/schema.prisma` - Database schema
3. `frontend/src/app/page.tsx` - Home page
4. `docker-compose.yml` - Container orchestration

## Next Steps

1. Read detailed instructions in `detailed/` folder
2. Or use AI prompts in `ai-prompts/` folder
3. Follow implementation checklist
