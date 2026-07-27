# Equilibria Finance - Project Rules v8.0

Kamu adalah Full-Stack Developer untuk proyek **Equilibria Finance** - aplikasi pencatatan keuangan pribadi dengan fitur lengkap. Gunakan rules ini sebagai panduan utama dalam setiap interaksi.

---

## 📋 PROJECT TECH STACK

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.8 (strict mode) |
| UI | React 19 + Tailwind CSS v4 |
| Animations | Framer Motion + Motion |
| ORM | Prisma 5.22 |
| Database | PostgreSQL |
| Validation | Zod v4 + React Hook Form |
| State | React Query v5 |
| API | Next.js API Routes |
| Auth | API Key-based |
| Logging | Pino (JSON structured) |
| Error Tracking | Sentry |
| Testing | Vitest + Playwright |
| Deployment | Vercel + Railway |
| Bots | Telegraf (Telegram) |
| AI | Google GenAI + Tesseract.js (OCR) |

---

## 🎯 ACTIVE SKILLS

Rules di bawah ini menginkorporasikan best practices dari 4 skills:
- `/frontend` - React/Next.js patterns
- `/api-design` - REST API design
- `/code-quality` - Testing & maintainability
- `/security` - Security best practices

---

## 1. FRONTEND DEVELOPMENT

### 1.1 State Management
- **Server State:** Gunakan React Query (`@tanstack/react-query`) untuk semua data fetching
- **Form State:** React Hook Form dengan Zod resolver
- **UI State:** Local component state (`useState`) atau Zustand jika global
- **URL State:** Gunakan `nuqs` atau native `useSearchParams` untuk query strings

### 1.2 Performance Optimization
```typescript
// ✅ GOOD: Selective re-renders dengan React Query
const { data } = useQuery({
  queryKey: ['transactions', { walletId, date }],
  queryFn: () => fetchTransactions(walletId, date),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// ❌ BAD: Fetch di useEffect
useEffect(() => {
  fetch('/api/transactions').then(setData);
}, []);
```

### 1.3 Loading & Error States
- Selalu tampilkan **skeleton screens** untuk content loading
- Gunakan **error boundaries** untuk menangkap JavaScript errors
- Implementasikan **retry mechanism** untuk failed requests

### 1.4 Optimistic Updates
```typescript
// ✅ GOOD: Optimistic update dengan rollback
const mutation = useMutation({
  mutationFn: createTransaction,
  onMutate: async (newTransaction) => {
    await queryClient.cancelQueries(['transactions']);
    const previous = queryClient.getQueryData(['transactions']);
    queryClient.setQueryData(['transactions'], (old) => [...old, newTransaction]);
    return { previous };
  },
  onError: (err, newTransaction, context) => {
    queryClient.setQueryData(['transactions'], context.previous);
  },
});
```

### 1.5 Core Web Vitals Targets
| Metric | Target | Optimization |
|--------|--------|--------------|
| LCP | < 2.5s | Optimize images, use next/image |
| FID | < 100ms | Code splitting, defer non-critical JS |
| CLS | < 0.1 | Reserve space for async content |

### 1.6 Accessibility (A11Y)
- Gunakan **semantic HTML** (`<button>`, `<nav>`, `<main>`)
- Implementasikan **keyboard navigation**
- Tambahkan **ARIA labels** untuk interactive elements
- Pastikan **color contrast** minimal 4.5:1
- Support **screen reader** dengan proper labeling

---

## 2. API DESIGN

### 2.1 REST API Conventions
```
GET    /api/transactions     → List transactions
GET    /api/transactions/:id  → Get single transaction
POST   /api/transactions      → Create transaction
PUT    /api/transactions/:id  → Replace transaction
PATCH  /api/transactions/:id  → Partial update
DELETE /api/transactions/:id  → Delete transaction
```

### 2.2 Response Format
```typescript
// Success Response
{
  "data": { ... },
  "meta": { "page": 1, "per_page": 20, "total": 100 }
}

// Error Response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [...],
    "request_id": "uuid"
  }
}
```

### 2.3 HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success dengan body |
| 201 | Created |
| 204 | Success tanpa body |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Error |

### 2.4 Pagination
```typescript
// Cursor-based pagination untuk large datasets
GET /api/transactions?cursor=abc123&limit=20

// Response dengan next cursor
{
  "data": [...],
  "next_cursor": "def456",
  "has_more": true
}
```

### 2.5 API Versioning
- Gunakan **URL versioning**: `/api/v1/`, `/api/v2/`
- Maintain **backward compatibility** minimal 90 hari
- Gunakan header `Deprecation` untuk deprecated endpoints

---

## 3. CODE QUALITY

### 3.1 TypeScript Strict Mode
```json
// tsconfig.json settings yang harus aktif
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### 3.2 Import Organization
```typescript
// Urutan import yang konsisten
import React from 'react';                           // 1. React
import { useState, useEffect } from 'react';         // 2. React hooks
import { Button } from '@/components/ui';             // 3. Internal components
import { formatDate } from '@/lib/utils';            // 4. Internal utils
import { Transaction } from '@prisma/client';       // 5. External packages
import type { CustomType } from '@/types';           // 6. Types
```

### 3.3 Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `totalAmount` |
| Functions | camelCase | `getTransactions()`, `calculateTotal()` |
| Types/Interfaces | PascalCase | `TransactionResponse`, `UserProfile` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Files | kebab-case | `transaction-api.ts`, `user-profile.tsx` |
| Directories | kebab-case | `api-routes`, `ui-components` |

### 3.4 Function Design
```typescript
// ✅ GOOD: Small, focused functions
async function getTransactionById(id: string): Promise<Transaction | null> {
  return prisma.transaction.findUnique({ where: { id } });
}

// ✅ GOOD: Use guard clauses
async function createTransaction(data: CreateTransactionDTO) {
  if (!data.amount || data.amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }
  
  const wallet = await getWallet(data.walletId);
  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }
  
  return prisma.transaction.create({ data });
}

// ❌ BAD: Large functions dengan nested conditionals
async function createTransaction(data) {
  if (data.amount) {
    if (data.amount > 0) {
      // deep nesting...
    }
  }
}
```

### 3.5 Error Handling
```typescript
// ✅ GOOD: Consistent error wrapper
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Typed error factory
const errors = {
  notFound: (resource: string) => 
    new AppError('NOT_FOUND', `${resource} not found`, 404),
  validation: (message: string, details?: unknown) => 
    new AppError('VALIDATION_ERROR', message, 422, details),
  unauthorized: () => 
    new AppError('UNAUTHORIZED', 'Invalid or missing API key', 401),
};
```

### 3.6 Testing Standards
```typescript
// ✅ Unit test structure (Arrange-Act-Assert)
describe('TransactionService', () => {
  describe('createTransaction', () => {
    it('should create transaction with valid data', async () => {
      // Arrange
      const mockData = { amount: 100, type: 'EXPENSE', category: 'Food' };
      
      // Act
      const result = await createTransaction(mockData);
      
      // Assert
      expect(result).toMatchObject({
        amount: 100,
        type: 'EXPENSE',
        category: 'Food',
      });
    });
    
    it('should throw ValidationError for negative amount', async () => {
      const mockData = { amount: -50, type: 'EXPENSE', category: 'Food' };
      await expect(createTransaction(mockData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### 3.7 Test Coverage Targets
| Type | Target | Priority |
|------|--------|----------|
| Business Logic | 90%+ | Critical |
| API Routes | 80%+ | High |
| UI Components | 60%+ | Medium |
| Utilities | 80%+ | High |

---

## 4. SECURITY

### 4.1 API Key Authentication
```typescript
// Validasi API key di setiap request
const expectedKey = process.env.API_SECRET_KEY;
if (!apiKey || !timingSafeEqual(apiKey, expectedKey)) {
  return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
}
```

### 4.2 Rate Limiting
- **Public endpoints:** 100 req/min
- **Sensitive endpoints:** 30 req/min
- **Write operations:** 60 req/min
- Gunakan in-memory store untuk development, Redis untuk production

### 4.3 Security Headers
```typescript
// Middleware security headers
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
```

### 4.4 Input Validation
```typescript
// ✅ GOOD: Validate with Zod at API boundary
import { z } from 'zod';

const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1).max(50),
  date: z.string().datetime(),
  description: z.string().max(500).optional(),
  walletId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = CreateTransactionSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', details: result.error.flatten() }
    }, { status: 422 });
  }
  
  // Proceed with validated data
  const data = result.data;
}
```

### 4.5 Secrets Management
- **NEVER** hardcode credentials di source code
- Gunakan environment variables untuk semua secrets
- Rotate API keys secara berkala (90 hari)
- Scan untuk secrets sebelum commit (pre-commit hook)

### 4.6 SQL Injection Prevention
```typescript
// ✅ GOOD: Parameterized queries via Prisma
const user = await prisma.transaction.findMany({
  where: { userId, date: { gte: startDate } }
});

// ❌ BAD: String interpolation
const user = await prisma.$queryRaw`SELECT * FROM transactions WHERE userId = ${userId}`;
```

---

## 5. DATABASE & ORM

### 5.1 Prisma Best Practices
```typescript
// ✅ Use select untuk hanya ambil field yang dibutuhkan
const transactions = await prisma.transaction.findMany({
  where: { walletId },
  select: { id: true, amount: true, date: true, category: true },
  orderBy: { date: 'desc' },
  take: 20,
});

// ✅ Gunakan include dengan bijak (avoid N+1)
const wallet = await prisma.wallet.findUnique({
  where: { id: walletId },
  include: {
    transactions: { take: 10, orderBy: { date: 'desc' } },
    _count: { select: { transactions: true } },
  },
});
```

### 5.2 Indexing Strategy
```prisma
// schema.prisma - Tambahkan index untuk query yang sering
model Transaction {
  id        String   @id @default(uuid())
  date     DateTime @default(now())
  walletId String
  category String
  
  @@index([walletId, date])  // Composite index untuk filter
  @@index([category])         // Index untuk aggregation
  @@index([date])              // Index untuk sorting
}
```

### 5.3 Migrations
- Selalu gunakan `prisma migrate dev` untuk development
- Review generated SQL sebelum apply
- Test migrations di environment yang sama dengan production
- Backup database sebelum production migration

---

## 6. CLEAN ARCHITECTURE

### 6.1 Directory Structure
```
src/
├── domain/              # Pure business logic (no external deps)
│   ├── entities/        # Core business objects
│   ├── value-objects/   # Immutable value types
│   ├── repositories/    # Repository interfaces
│   └── services/        # Domain services
├── application/         # Use cases & orchestration
│   ├── use-cases/       # Single-purpose operations
│   ├── dto/             # Data transfer objects
│   └── interfaces/      # Application interfaces
├── infrastructure/      # External implementations
│   ├── database/        # Prisma implementation
│   ├── external/        # Third-party integrations
│   └── api/             # API clients
└── lib/                 # Shared utilities

app/
├── api/                 # API routes (presentation)
├── components/         # React components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
└── (routes)/           # Page components
```

### 6.2 Dependency Rule
```
domain ← application ← infrastructure ← presentation (app/)
   ↑           ↑            ↑
   └───────────┴────────────┘
           (interfaces only)
```

### 6.3 Repository Pattern
```typescript
// domain/repositories/transaction-repository.ts (interface)
interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByWallet(walletId: string, dateRange?: DateRange): Promise<Transaction[]>;
  create(data: CreateTransactionInput): Promise<Transaction>;
  update(id: string, data: UpdateTransactionInput): Promise<Transaction>;
  delete(id: string): Promise<void>;
}

// infrastructure/database/prisma-transaction-repository.ts (implementation)
class PrismaTransactionRepository implements ITransactionRepository {
  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  }
  // ... implementation
}
```

---

## 7. OBSERVABILITY

### 7.1 Structured Logging
```typescript
import pino from 'pino';

// ✅ Consistent log format
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

// ✅ Log dengan context
logger.info({ 
  event: 'transaction_created',
  transactionId: id,
  walletId: wallet.id,
  amount: data.amount,
}, 'Transaction created successfully');
```

### 7.2 Error Tracking
```typescript
import * as Sentry from '@sentry/nextjs';

// Wrap API handlers dengan Sentry
export const config = {
  api: {
    externalResolver: true,
  },
};

async function handler(req: NextRequest) {
  try {
    // API logic
  } catch (error) {
    Sentry.captureException(error, {
      extra: { path: req.nextUrl.pathname },
    });
    throw error;
  }
}
```

### 7.3 Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        version: process.env.npm_package_version,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    }, { status: 503 });
  }
}
```

---

## 8. DEPLOYMENT & CI/CD

### 8.1 Deployment Targets
| Environment | Platform | Notes |
|-------------|----------|-------|
| Production | Vercel | Primary deployment |
| Preview | Vercel | PR previews |
| Staging | Railway | Pre-production testing |

### 8.2 Environment Variables
```bash
# Required untuk production
DATABASE_URL=postgresql://...
API_SECRET_KEY=<secure-random-256-bit>
SENTRY_DSN=https://...
NEXT_PUBLIC_APP_URL=https://...

# Optional
REDIS_URL=redis://...        # For distributed rate limiting
ANALYTICS_ID=UA-...          # Google Analytics
```

### 8.3 Build Pipeline
```yaml
# GitHub Actions (jika diperlukan)
1. Install dependencies (pnpm)
2. Type check (tsc --noEmit)
3. Lint (eslint)
4. Unit tests (vitest run)
5. Build (next build)
6. E2E tests (playwright)
7. Deploy to Vercel
```

---

## 9. GIT WORKFLOW

### 9.1 Branch Naming
```
feature/transaction-validation
fix/rate-limit-bypass
chore/update-prisma
docs/api-endpoints
```

### 9.2 Commit Messages (Conventional Commits)
```
feat: add transaction import from XLSX
fix: correct date parsing in transaction creation
refactor: extract validation schema to separate module
docs: update API documentation for wallets endpoint
test: add unit tests for budget calculation
chore: update dependencies to latest versions
```

### 9.3 PR Checklist
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] ESLint clean
- [ ] Updated documentation
- [ ] Migration files included (if DB changes)
- [ ] Environment variables documented

---

## 10. DEVELOPMENT WORKFLOW

### 10.1 Local Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd equilibria-finance

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Setup database
pnpm db:setup

# 5. Start development
pnpm dev
```

### 10.2 Common Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run unit tests
pnpm test:watch   # Watch mode
pnpm test:e2e     # Run E2E tests
pnpm db:migrate   # Run migrations
pnpm db:generate  # Generate Prisma client
pnpm db:studio    # Open Prisma Studio
```

---

## 📖 QUICK REFERENCE

### Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing API key |
| FORBIDDEN | 403 | Valid key but insufficient permissions |
| NOT_FOUND | 404 | Resource does not exist |
| VALIDATION_ERROR | 422 | Request data validation failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

### File Naming
| Type | Pattern | Example |
|------|---------|---------|
| API Route | `route.ts` | `app/api/transactions/route.ts` |
| Page | `page.tsx` | `app/transactions/page.tsx` |
| Component | `PascalCase.tsx` | `TransactionCard.tsx` |
| Hook | `use*`.ts | `useTransactions.ts` |
| Utility | `kebab-case.ts` | `date-utils.ts` |
| Type | `*.types.ts` | `transaction.types.ts` |

---

**Version:** 8.0 | **Last Updated:** 2026-07-27
**Activated Skills:** /frontend, /api-design, /code-quality, /security
