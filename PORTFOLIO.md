# 📚 Portfolio - Equilibria V.2

## 🎯 Project Overview

**Equilibria V.2** adalah aplikasi pencatatan keuangan pribadi yang dibangun dengan arsitektur modern, menggunakan prinsip Clean Architecture dan Domain-Driven Design (DDD) untuk skalabilitas dan maintainability jangka panjang.

### 🔗 Live Demo
**Production URL:** https://equilibria-v2.vercel.app

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| React 19 | UI library |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| React Query | Data fetching & caching |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Backend API |
| Prisma ORM | Database abstraction |
| PostgreSQL (Neon) | Cloud database |
| Vercel | Deployment platform |

### Testing & Quality
| Technology | Purpose |
|------------|---------|
| Vitest | Unit & integration tests |
| Playwright | E2E testing |
| TypeScript | Type safety |

---

## 🏗️ Architecture (Clean Architecture + DDD)

```
src/
├── domain/              # Business Logic (Pure)
│   ├── entities/        # Transaction, Budget, Wallet, etc.
│   ├── value-objects/   # TransactionType, Money, Amount
│   ├── repositories/   # Repository interfaces
│   └── events/         # Domain events
│
├── application/         # Use Cases
│   ├── services/       # FinanceService
│   └── use-cases/     # TransactionUseCases, BudgetUseCases
│
└── infrastructure/     # External Concerns
    ├── database/       # Prisma client
    ├── repositories/   # Repository implementations
    └── services/       # Telegram, Notifications
```

### Why Clean Architecture?
- **Testability** - Domain logic tanpa dependency
- **Maintainability** - Perubahan di satu layer tidak affect layer lain
- **Scalability** - Mudah migrate ke teknologi lain
- **DDD Principles** - Ubiquitous Language, Bounded Contexts

---

## ✨ Features

### Core Features
| Feature | Description | Status |
|---------|-------------|--------|
| Dashboard | Ringkasan keuangan real-time | ✅ |
| Transactions | CRUD transaksi lengkap | ✅ |
| Multi-Wallet | Multi-currency (IDR, USD, EUR) | ✅ |
| Budget | Batas pengeluaran per kategori | ✅ |
| Goals | Target tabungan dengan progress | ✅ |
| Debts | Hutang & piutang management | ✅ |
| Recurring | Transaksi otomatis berulang | ✅ |
| Reminders | Pengingat jatuh tempo | ✅ |

### Advanced Features
| Feature | Description | Status |
|---------|-------------|--------|
| PIN Protection | Keamanan app dengan PIN 6 digit | ✅ |
| Biometric Auth | Fingerprint/Face unlock | ✅ |
| Telegram Bot | Catat transaksi via chat | ✅ |
| PWA | Install sebagai native app | ✅ |
| Offline Support | Cache & sync data | ✅ |
| Export | Export data (CSV, Excel) | ✅ |

---

## 🔐 Security Features

```typescript
// Security Implementation

// 1. Rate Limiting
const rateLimit = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

// 2. CSRF Protection
// Header validation untuk POST/PUT/DELETE

// 3. Input Sanitization
const sanitize = (input: string) => 
  input.trim().replace(/[<>]/g, '');

// 4. Security Headers
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
}
```

---

## 🧪 Testing Strategy

### Test Coverage
```
tests/
├── domain/          # 40+ tests - Entities & Value Objects
├── application/     # 15+ tests - Services & Use Cases
├── api/             # 20+ tests - API Endpoints
├── infrastructure/  # 15+ tests - Repositories
├── e2e/            # 30+ tests - User Flows
└── lib/            # 50+ tests - Utilities

Total: 170+ tests
```

### Test Examples
```typescript
// Domain Entity Test
describe('Budget Entity', () => {
  it('should identify over-budget status', () => {
    const budget = createBudget({ limit: 1000000 });
    const spent = 1200000;
    
    expect(isOverBudget(budget, spent)).toBe(true);
    expect(getRemainingAmount(budget, spent)).toBe(-200000);
  });
});
```

---

## 📊 Performance Optimizations

### 1. React Query Caching
```typescript
// Data fetching with caching
const { data } = useQuery({
  queryKey: ['transactions'],
  queryFn: fetchTransactions,
  staleTime: 60 * 1000, // 1 minute
  gcTime: 10 * 60 * 1000, // 10 minutes
});
```

### 2. Static Generation
```typescript
// Pre-render static pages
export const dynamic = 'force-static';
```

### 3. Bundle Optimization
```
First Load JS: 102 kB (shared)
├── React + Next.js core: ~50 kB
├── UI components: ~30 kB
└── Charts (lazy): loaded on demand
```

---

## 📱 Mobile-First Design

### Responsive Breakpoints
```css
/* Mobile First */
.sm  /* 640px  - Small tablets */
.md  /* 768px  - Tablets */
.lg  /* 1024px - Laptops */
.xl  /* 1280px - Desktops */
```

### PWA Features
- Service Worker untuk offline
- Web App Manifest
- Install prompt
- Push notifications

---

## 🔄 CI/CD Pipeline

```yaml
# GitHub Actions (example)
name: Deploy
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - run: npm test
      - run: npm run build
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: amondnet/vercel-action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📈 Metrics & Monitoring

### Health Check Endpoint
```bash
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-06-10T12:00:00Z",
  "checks": {
    "database": { "status": "pass", "latency": 45 },
    "api": { "status": "pass", "latency": 12 },
    "memory": { "status": "pass", "percentage": 65 }
  }
}
```

---

## 👨‍💻 Developer Experience

### Scripts Available
```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Unit tests
npm run test:e2e    # E2E tests
npm run lint         # Code linting
npm run db:migrate   # Database migrations
npm run key:generate # API keys
```

### Code Quality
- ESLint + Prettier
- TypeScript strict mode
- Conventional Commits
- Git hooks (lint-staged)

---

## 🚀 Future Enhancements

| Feature | Priority | Status |
|---------|----------|--------|
| Multi-user support | High | Planned |
| AI expense categorization | Medium | Researching |
| Investment tracking | Medium | Planned |
| Bill splitting | Low | Backlog |
| Dark/Light theme | Done | ✅ |

---

## 📞 Contact

- **GitHub:** github.com/your-username/equilibria-v2
- **Email:** admin@equilibria.app
- **LinkedIn:** linkedin.com/in/your-profile

---

## 📄 License

Private Project - All rights reserved

---

*Built with using Next.js, TypeScript, and Clean Architecture*