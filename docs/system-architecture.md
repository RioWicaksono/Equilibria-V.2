# System Architecture Diagram

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EQUILIBRIA FINANCE                                 │
│                        Personal Finance Application                           │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Mobile  │   │   Web    │   │ Telegram │
            │    App   │   │  Browser │   │    Bot   │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  └───────────────┼───────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL EDGE                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   Vercel   │  │    Edge    │  │   Sentry   │  │    Rate Limiter     ││
│  │  Functions │  │  Middleware │  │   (Error)  │  │    (Middleware)      ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘│
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────────────┴────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS APPLICATION                                │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         PRESENTATION LAYER                              │  │
│  │                                                                       │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │   │   Pages/    │  │ Components/ │  │   Hooks/    │  │  Context/ │  │  │
│  │   │   Routes    │  │   (React)   │  │   (State)   │  │  (Auth)   │  │  │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │  │
│  └──────────┼────────────────┼────────────────┼──────────────────┼────────┘  │
│             │                │                │                  │           │
│             └────────────────┴────────────────┴──────────────────┘           │
│                                       │                                       │
│                                       ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          API LAYER (Next.js API Routes)                │  │
│  │                                                                       │  │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │   │ /api/   │ │ /api/   │ │ /api/   │ │ /api/   │ │ /api/   │        │  │
│  │   │transac- │ │ budgets │ │ wallets │ │  goals  │ │  debts  │        │  │
│  │   │  tions  │ │         │ │         │ │         │ │         │        │  │
│  │   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │  │
│  └────────┼────────────┼────────────┼────────────┼────────────┼─────────────┘  │
│           │            │            │            │            │              │
│           └────────────┴────────────┼────────────┴────────────┘              │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      APPLICATION LAYER (Services)                      │  │
│  │                                                                       │  │
│  │   ┌─────────────────────┐    ┌─────────────────────┐                │  │
│  │   │  FinanceService     │    │  BudgetService      │                │  │
│  │   │  - Transactions    │    │  - Budget CRUD     │                │  │
│  │   │  - Wallets        │    │  - Calculations    │                │  │
│  │   │  - Summary        │    │                   │                │  │
│  │   └──────────┬──────────┘    └──────────┬──────────┘                │  │
│  │              │                          │                           │  │
│  │              └──────────┬───────────────┘                           │  │
│  │                         │                                            │  │
│  │                         ▼                                            │  │
│  │   ┌─────────────────────────────────────────────────────────────┐  │  │
│  │   │                    DOMAIN LAYER                              │  │  │
│  │   │                                                              │  │  │
│  │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │  │
│  │   │   │  Entities   │  │Value Objects│  │   Repositories  │    │  │  │
│  │   │   │- Transaction│  │- Amount     │  │  (Interfaces)   │    │  │  │
│  │   │   │- Budget    │  │- Currency   │  │- ITransaction   │    │  │  │
│  │   │   │- Wallet    │  │- Period     │  │- IBudget       │    │  │  │
│  │   │   │- Goal     │  │             │  │- IWallet       │    │  │  │
│  │   │   └─────────────┘  └─────────────┘  └─────────────────┘    │  │  │
│  │   │                                                              │  │  │
│  │   └─────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                                │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │   PostgreSQL   │  │    Redis      │  │    External    │                 │
│  │   (Prisma)    │  │   (Cache &    │  │   Services    │                 │
│  │                │  │    Queue)     │  │               │                 │
│  │  - Primary DB  │  │               │  │  - Telegram   │                 │
│  │  - Migrations │  │  - Rate Limit │  │  - Google AI  │                 │
│  │  - Backups    │  │  - Sessions   │  │  - Sentry    │                 │
│  │               │  │  - Pub/Sub   │  │  - Vercel    │                 │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                 │
│          │                   │                   │                          │
└──────────┼───────────────────┼───────────────────┼──────────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   Neon     │     │  Upstash   │     │   Telegram  │
    │  Postgres  │     │   Redis    │     │    Bot API  │
    │  (Cloud)   │     │  (Cloud)   │     │             │
    └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Data Flow

### 1. Transaction Creation Flow

```
[User Input] 
     │
     ▼
[React Form] ──validates──▶ [Zod Schema]
     │
     │ invalid
     ▼
[Error Display]
     │
     │ valid
     ▼
[useMutation (React Query)]
     │
     ├─ onMutate: [Optimistic Update]
     │
     ▼
[POST /api/transactions]
     │
     ├─ Rate Limit Check
     ├─ Auth Check  
     ├─ Input Validation
     │
     ▼
[FinanceService.addTransaction()]
     │
     ▼
[Domain: Create Transaction Entity]
     │
     ▼
[Repository: Save to Database]
     │
     ├─ Success: invalidateQueries → [UI Update]
     │
     └─ Error: rollback → [Error Toast]
```

### 2. Request Lifecycle

```
[Client Request]
     │
     ▼
[Vercel Edge Middleware]
     │
     ├─ CORS Headers
     ├─ Security Headers
     ├─ Rate Limiting
     │
     ▼
[Next.js API Route]
     │
     ├─ Auth Middleware
     ├─ Request Validation
     │
     ▼
[Application Service]
     │
     ▼
[Domain Layer]
     │
     ▼
[Infrastructure (Prisma)]
     │
     ▼
[PostgreSQL Database]
     │
     ▼
[Response]
```

---

## Directory Structure

```
equilibria-finance/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── wallets/
│   │   ├── goals/
│   │   ├── debts/
│   │   ├── health/
│   │   └── docs/
│   │
│   ├── (routes)/                # Page Components
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── wallets/
│   │   └── settings/
│   │
│   ├── components/              # React Components
│   │   ├── ui/                  # Base UI
│   │   ├── forms/               # Form Components
│   │   └── charts/              # Data Visualization
│   │
│   ├── hooks/                  # Custom Hooks
│   └── contexts/               # React Contexts
│
├── src/
│   ├── domain/                  # Business Logic (Pure)
│   │   ├── entities/            # Domain Objects
│   │   ├── value-objects/       # Immutable Types
│   │   ├── repositories/         # Repository Interfaces
│   │   └── services/            # Domain Services
│   │
│   ├── application/             # Use Cases
│   │   ├── services/            # Application Services
│   │   ├── use-cases/          # Single-Purpose Operations
│   │   └── dto/                # Data Transfer Objects
│   │
│   ├── infrastructure/           # External Implementations
│   │   ├── database/           # Prisma Implementation
│   │   ├── external/           # Third-party APIs
│   │   └── services/           # Infrastructure Services
│   │
│   └── lib/                     # Shared Utilities
│       ├── api-helpers.ts       # Response Formatters
│       ├── validation.ts       # Zod Schemas
│       ├── rate-limit.ts       # Rate Limiting
│       └── logger.ts           # Logging
│
├── prisma/
│   └── schema.prisma            # Database Schema
│
├── tests/
│   ├── unit/                    # Unit Tests
│   ├── integration/             # Integration Tests
│   └── e2e/                     # End-to-End Tests
│
└── docs/
    ├── adr/                     # Architecture Decision Records
    └── diagrams/                 # System Diagrams
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Network Security
├── HTTPS (TLS 1.2+)
├── HSTS Header
└── CSP (Content Security Policy)

Layer 2: API Security
├── API Key Authentication
├── Rate Limiting (Redis)
├── Request Validation (Zod)
└── CSRF Protection

Layer 3: Data Security
├── Parameterized Queries (Prisma)
├── Input Sanitization
└── Output Encoding

Layer 4: Monitoring
├── Sentry Error Tracking
├── Structured Logging (Pino)
└── Audit Logs
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐          ┌─────────────────┐
│   Development    │          │    Production    │
│   (Local)       │          │    (Vercel)     │
└────────┬────────┘          └────────┬────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐          ┌─────────────────┐
│  Local Postgres │          │    Neon DB      │
│  (Docker)       │          │    (Cloud)      │
└─────────────────┘          └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CI/CD PIPELINE                             │
└─────────────────────────────────────────────────────────────────┘

[Push/Pull Request]
        │
        ▼
┌─────────────────┐
│  1. Lint &     │
│     Type Check  │
└────────┬────────┘
         │ ✅
         ▼
┌─────────────────┐
│  2. Unit Tests  │
│     + Coverage  │
└────────┬────────┘
         │ ✅
         ▼
┌─────────────────┐
│  3. Security    │
│     Scans       │
│  • npm audit    │
│  • Trivy        │
│  • Secrets      │
└────────┬────────┘
         │ ✅
         ▼
┌─────────────────┐
│  4. E2E Tests   │
│     (Playwright) │
└────────┬────────┘
         │ ✅
         ▼
┌─────────────────┐
│  5. Deploy      │
│     Preview      │
└────────┬────────┘
         │ ✅ (main only)
         ▼
┌─────────────────┐
│  6. Deploy      │
│     Production   │
└─────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS |
| **Backend** | Next.js API Routes, TypeScript |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **State** | React Query, Zustand |
| **Validation** | Zod, React Hook Form |
| **API Docs** | Swagger/OpenAPI |
| **Error Tracking** | Sentry |
| **Logging** | Pino |
| **Rate Limiting** | Redis (Upstash) |
| **Deployment** | Vercel |
| **Bot** | Telegram (Telegraf) |
| **AI** | Google GenAI |
| **Testing** | Vitest, Playwright |
