# ADR-002: Database ORM Choice - Prisma

**Status:** Accepted  
**Date:** 2026-06-03  
**Deciders:** Project Owner

---

## Context

Equilibria Finance membutuhkan ORM yang:
- Supports PostgreSQL
- Provides type safety with TypeScript
- Has excellent developer experience
- Supports migrations
- Has good performance for read-heavy workloads

---

## Decision

Menggunakan **Prisma ORM** dengan PostgreSQL.

### Schema Example

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Transaction {
  id          String   @id @default(uuid())
  amount      Float
  type        String   // 'INCOME' | 'EXPENSE'
  category    String
  date        DateTime
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  walletId    String?
  Wallet      Wallet?  @relation(fields: [walletId], references: [id])

  @@index([walletId, date])
  @@index([category])
}
```

---

## Consequences

### ✅ Advantages
- **Type Safety:** End-to-end TypeScript types from schema
- **Type-safe queries:** No SQL injection possible
- **Migration system:** Version-controlled schema changes
- **Developer Experience:** Great CLI, auto-completion, Studio
- **Performance:** Connection pooling, query batching

### ❌ Disadvantages
- **Runtime queries:** Prisma runtime overhead vs raw SQL
- **Limited raw SQL:** Complex queries may need `$queryRaw`
- **Learning curve:** Unique Prisma syntax to learn

---

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| TypeORM | Mature, many features | Complex, less type-safe | Rejected |
| Drizzle | Lightweight, type-safe | Newer, smaller community | Consider for v2 |
| Raw SQL | Maximum performance | No type safety, manual mapping | Rejected |
| Prisma | Best DX, type-safe | Some runtime overhead | **Accepted** |

---

## Performance Considerations

```typescript
// ✅ GOOD: Select only needed fields
const transactions = await prisma.transaction.findMany({
  where: { walletId },
  select: { id: true, amount: true, date: true, category: true },
  orderBy: { date: 'desc' },
  take: 20,
});

// ✅ GOOD: Use include wisely (avoid N+1)
const wallet = await prisma.wallet.findUnique({
  where: { id: walletId },
  include: {
    transactions: { take: 10, orderBy: { date: 'desc' } },
    _count: { select: { transactions: true } },
  },
});
```

---

## Notes

- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- Consider `prisma db pull` to reverse-engineer existing DB

---

**Supersedes:** N/A  
**Related ADRs:** ADR-003 (Clean Architecture), ADR-001 (Authentication)
