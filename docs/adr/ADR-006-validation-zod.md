# ADR-006: Validation Strategy - Zod

**Status:** Accepted  
**Date:** 2026-06-10  
**Deciders:** Project Owner

---

## Context

Equilibria Finance membutuhkan validation strategy yang:
- Works with TypeScript for type inference
- Has good error messages for users
- Can be used in both API (server) and Forms (client)
- Supports complex validation rules

---

## Decision

Menggunakan **Zod** sebagai primary validation library.

### Schema Definition

```typescript
// lib/validation.ts
import { z } from 'zod';

// Transaction Schemas
export const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const CreateTransactionSchema = z.object({
  amount: z.number().positive('Jumlah harus positif'),
  type: TransactionTypeSchema,
  category: z.string().min(1, 'Kategori wajib diisi').max(50),
  description: z.string().max(500).optional(),
  date: z.string().datetime({ message: 'Format tanggal tidak valid' }),
  walletId: z.string().uuid('ID wallet tidak valid').optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.extend({
  id: z.string().uuid('ID transaksi tidak valid'),
}).partial();

// Budget Schemas
export const CreateBudgetSchema = z.object({
  category: z.string().min(1).max(50),
  limit: z.number().positive().max(1_000_000_000),
});

// Wallet Schemas
export const CreateWalletSchema = z.object({
  name: z.string().min(1).max(100),
  balance: z.number().min(0).default(0),
  description: z.string().max(500).optional(),
});
```

### API Usage

```typescript
// app/api/transactions/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = CreateTransactionSchema.safeParse(body);

    if (!result.success) {
      return ApiResponse.badRequest(
        'Validation failed',
        result.error.flatten().fieldErrors
      );
    }

    // Type-safe data
    const data = result.data; // TypeScript knows the shape
    const transaction = await financeService.addTransaction(data);
    return ApiResponse.created({ transaction });

  } catch (error) {
    logger.error('[POST /api/transactions]', error);
    return ApiResponse.internalError();
  }
}
```

### Form Usage (React Hook Form)

```typescript
// components/TransactionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTransactionSchema } from '@/lib/validation';

export function TransactionForm() {
  const form = useForm({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: 0,
      category: '',
      date: new Date().toISOString(),
    },
  });

  const onSubmit = async (data: CreateTransactionInput) => {
    // data is fully typed and validated
    await createTransaction(data);
  };

  // ...
}
```

---

## Consequences

### ✅ Advantages
- **Type inference:** No need to define types separately
- **Reusable:** Same schema for API and forms
- **Composable:** Easy to extend schemas
- **Performance:** Fast validation
- **Good errors:** Clear, i18n-friendly messages

### ❌ Disadvantages
- **Runtime validation:** Some overhead vs compile-time
- **Bundle size:** Adds ~15KB to bundle
- **Learning curve:** Zod-specific syntax

---

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Yup | Popular, good docs | Slower, no inference | Rejected |
| Joi | Powerful, mature | No TypeScript, heavy | Rejected |
| Valibot | Smaller bundle | Newer, less community | Consider v2 |
| Zod | Best DX, inference | Slightly larger | **Accepted** |

---

## Best Practices

### 1. Use domain-specific error messages
```typescript
// ❌ Generic
amount: z.number().positive()

// ✅ Domain-specific (Indonesian)
amount: z.number().positive('Jumlah harus lebih dari 0')
```

### 2. Validate at API boundary
```typescript
// Always validate at API, not just in service
export async function POST(req: Request) {
  const result = CreateTransactionSchema.safeParse(await req.json());
  // NOT: const result = createTransactionSchema.parse(await req.json());
}
```

### 3. Use transforms for data cleaning
```typescript
const SanitizedStringSchema = z.string()
  .transform(val => val.trim())
  .refine(val => val.length > 0, 'Cannot be empty');
```

---

## Notes

- Keep schemas in `lib/validation.ts`
- Use Indonesian messages for user-facing errors
- Consider Zod v4 for improved performance

---

**Supersedes:** N/A  
**Related ADRs:** ADR-004 (Error Handling), ADR-003 (Clean Architecture)
