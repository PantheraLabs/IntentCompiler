# Frontend Developer Instructions

## Technology Stack
- Framework: React 18.x
- Meta-framework: Next.js 14.x
- Styling: Tailwind CSS
- State: Zustand
- Forms: React Hook Form + Zod

## Project Structure
```
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
```

## Key Components

### Authentication
```tsx
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
```

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
