# DevOps Engineer Instructions

## Deployment Strategy
**Platform:** Docker
**Scale:** Medium

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
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
      DATABASE_URL: postgresql://appuser:${DB_PASSWORD}@postgres:5432/appdb
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
```

## CI/CD Pipeline

### GitHub Actions
```yaml
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
```

## Environment Variables
```bash
DB_PASSWORD=change_in_production
JWT_SECRET=use_long_random_string
API_URL=http://localhost:3000
```

## Implementation Timeline
- **Week 1:** Infrastructure setup
- **Week 2:** Deployment & monitoring

Total: 2 weeks
