# Backend Developer Instructions

## Technology Stack
- Runtime: Node.js 20.x
- Framework: Express.js 4.x
- Database: PostgreSQL 15
- ORM: Prisma
- Auth: JWT + bcrypt

## Database Schema

```sql
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
```

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
```
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
```

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
