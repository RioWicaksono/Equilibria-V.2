# ADR-003: Clean Architecture Implementation

**Status:** Accepted  
**Date:** 2026-06-03  
**Deciders:** Project Owner

---

## Context

Equilibria Finance membutuhkan arsitektur yang:
- Isolates business logic dari framework/infrastructure
- Makes code testable dan maintainable
- Supports future scaling tanpa refactoring besar

---

## Decision

Implement Clean Architecture dengan 4 layer:

### Directory Structure

```
src/
├── domain/                    # Pure business logic
│   ├── entities/             # Core business objects
│   │   ├── Transaction.ts
│   │   ├── Wallet.ts
│   │   ├── Budget.ts
│   │   └── ...
│   ├── value-objects/        # Immutable value types
│   │   ├── Amount.ts
│   │   ├── Currency.ts
│   │   └── TransactionType.ts
│   ├── repositories/        # Repository interfaces
│   │   └── ITransactionRepository.ts
│   └── services/            # Domain services
│       └── BudgetCalculator.ts
│
├── application/              # Use cases & orchestration
│   ├── services/            # Application services
│   │   └── FinanceService.ts
│   ├── use-cases/          # Single-purpose operations
│   │   ├── CreateTransaction.ts
│   │   └── CalculateBudget.ts
│   └── dto/                 # Data transfer objects
│       └── TransactionDTO.ts
│
├── infrastructure/          # External implementations
│   ├── database/           # Prisma implementation
│   │   └── PrismaTransactionRepository.ts
│   ├── external/          # Third-party integrations
│   │   └── TelegramBot.ts
│   └── services/          # Infrastructure services
│       └── NotificationService.ts
│
└── lib/                     # Shared utilities
    ├── validation.ts
    ├── logger.ts
    └── helpers.ts
```

### Dependency Rule

```
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│          (app/api, app/components)          │
└──────────────────┬──────────────────────────┘
                   │ depends on
                   ▼
┌─────────────────────────────────────────────┐
│            Infrastructure Layer              │
│        (database, external services)         │
└──────────────────┬──────────────────────────┘
                   │ implements
                   ▼
┌─────────────────────────────────────────────┐
│             Application Layer                │
│            (services, use-cases)            │
└──────────────────┬──────────────────────────┘
                   │ depends on interfaces
                   ▼
┌─────────────────────────────────────────────┐
│               Domain Layer                  │
│         (entities, value objects)           │
└─────────────────────────────────────────────┘
```

---

## Consequences

### ✅ Advantages
- **Testability:** Domain layer has no external dependencies
- **Maintainability:** Changes in one layer don't affect others
- **Flexibility:** Can swap infrastructure (e.g., Prisma → Drizzle)
- **Scalability:** Clear boundaries for team collaboration

### ❌ Disadvantages
- **Boilerplate:** More files and interfaces to maintain
- **Learning curve:** Developers need to understand layers
- **Overhead:** May be overkill for small projects

---

## Implementation Example

### Domain Layer (Pure)
```typescript
// src/domain/entities/Transaction.ts
export class Transaction {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly type: TransactionType,
    public readonly category: string,
    public readonly date: Date,
    public readonly description: string
  ) {}

  isExpense(): boolean {
    return this.type === TransactionType.EXPENSE;
  }

  isIncome(): boolean {
    return this.type === TransactionType.INCOME;
  }
}
```

### Application Layer (Uses Domain)
```typescript
// src/application/services/FinanceService.ts
import { ITransactionRepository } from '@/domain/repositories';

export class FinanceService {
  constructor(private transactionRepo: ITransactionRepository) {}

  async getTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.findAll();
  }

  async addTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
    const transaction = new Transaction(
      generateId(),
      dto.amount,
      dto.type,
      dto.category,
      new Date(dto.date),
      dto.description
    );
    return this.transactionRepo.create(transaction);
  }
}
```

### Infrastructure Layer (Implements Interface)
```typescript
// src/infrastructure/database/PrismaTransactionRepository.ts
import { ITransactionRepository } from '@/domain/repositories';
import { prisma } from './PrismaClient';

export class PrismaTransactionRepository implements ITransactionRepository {
  async findAll(): Promise<Transaction[]> {
    const records = await prisma.transaction.findMany();
    return records.map(r => new Transaction(r.id, r.amount, r.type, ...));
  }
}
```

---

## Notes

- Domain layer **MUST NOT** import from `prisma`, `next`, or any external package
- Use dependency injection to wire layers together
- Keep domain objects as plain TypeScript classes

---

**Supersedes:** N/A  
**Related ADRs:** ADR-002 (Prisma ORM), ADR-004 (Error Handling)
