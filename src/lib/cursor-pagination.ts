/**
 * Cursor-based pagination utilities for Prisma
 *
 * This module provides helpers for implementing efficient cursor-based
 * pagination that works well with large datasets (>10k records).
 *
 * Unlike offset pagination which becomes slow with large offsets,
 * cursor pagination maintains consistent performance regardless of
 * dataset size.
 */

import type { Transaction } from '@/domain/entities/Transaction';
import type { Budget } from '@/domain/entities/Budget';
import type { Prisma } from '@prisma/client';
import {
  encodeCursor,
  decodeCursor,
  type CursorData,
} from './api-helpers';

// ============================================
// CURSOR ENCODING FOR COMMON ENTITIES
// ============================================

/**
 * Create cursor data from a transaction
 */
export function createTransactionCursor(transaction: Transaction): CursorData {
  return {
    id: transaction.id,
    createdAt: transaction.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Create cursor data from a budget
 */
export function createBudgetCursor(budget: Budget): CursorData {
  const createdAt = budget.createdAt instanceof Date
    ? budget.createdAt.toISOString()
    : String(budget.createdAt);
  return {
    id: budget.id,
    createdAt,
  };
}

/**
 * Encode transaction as cursor string
 */
export function encodeTransactionCursor(transaction: Transaction): string {
  return encodeCursor(createTransactionCursor(transaction));
}

/**
 * Encode budget as cursor string
 */
export function encodeBudgetCursor(budget: Budget): string {
  return encodeCursor(createBudgetCursor(budget));
}

// ============================================
// CURSOR DECODING FOR PRISMA QUERIES
// ============================================

/**
 * Parse cursor and return Prisma where clause for transactions
 * Orders by createdAt DESC, id ASC for consistent ordering
 */
export function getTransactionCursorWhere(
  cursorString?: string
): Prisma.TransactionWhereInput | undefined {
  if (!cursorString) return undefined;

  const cursor = decodeCursor(cursorString);
  if (!cursor) return undefined;

  const cursorDate = new Date(cursor.createdAt);

  // Use composite cursor for consistent pagination
  // This handles duplicate createdAt timestamps
  return {
    OR: [
      {
        createdAt: { lt: cursorDate },
      },
      {
        createdAt: cursorDate,
        id: { lt: cursor.id },
      },
    ],
  };
}

/**
 * Parse cursor and return Prisma where clause for budgets
 */
export function getBudgetCursorWhere(
  cursorString?: string
): Prisma.BudgetWhereInput | undefined {
  if (!cursorString) return undefined;

  const cursor = decodeCursor(cursorString);
  if (!cursor) return undefined;

  const cursorDate = new Date(cursor.createdAt);

  return {
    OR: [
      {
        createdAt: { lt: cursorDate },
      },
      {
        createdAt: cursorDate,
        id: { lt: cursor.id },
      },
    ],
  };
}

// ============================================
// PRISMA PAGINATION HELPERS
// ============================================

/**
 * Build Prisma findMany args for cursor-based pagination
 * Transactions are sorted by createdAt DESC, id ASC for consistency
 */
export function buildTransactionPaginationArgs(
  cursorString?: string,
  limit: number = 20,
  additionalWhere?: Prisma.TransactionWhereInput
): Prisma.TransactionFindManyArgs {
  const cursorWhere = getTransactionCursorWhere(cursorString);

  const whereConditions: Prisma.TransactionWhereInput[] = [];
  if (additionalWhere) whereConditions.push(additionalWhere);
  if (cursorWhere) whereConditions.push(cursorWhere);

  return {
    where: whereConditions.length > 1 ? { AND: whereConditions } : whereConditions[0] || undefined,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: limit + 1, // Fetch one extra to determine has_more
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      description: true,
      date: true,
      createdAt: true,
      walletId: true,
    },
  };
}

/**
 * Build Prisma findMany args for budget cursor pagination
 */
export function buildBudgetPaginationArgs(
  cursorString?: string,
  limit: number = 20,
  additionalWhere?: Prisma.BudgetWhereInput
): Prisma.BudgetFindManyArgs {
  const cursorWhere = getBudgetCursorWhere(cursorString);

  const whereConditions: Prisma.BudgetWhereInput[] = [];
  if (additionalWhere) whereConditions.push(additionalWhere);
  if (cursorWhere) whereConditions.push(cursorWhere);

  return {
    where: whereConditions.length > 1 ? { AND: whereConditions } : whereConditions[0] || undefined,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: limit + 1,
  };
}

// ============================================
// PAGINATION RESULT TRANSFORMER
// ============================================

/**
 * Transform Prisma result to paginated response
 * Returns actual items (limit) and has_more indicator
 */
export function transformToPaginatedResult<T extends { id: string; createdAt?: Date }>(
  items: T[],
  limit: number
): {
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
} {
  // Check if there's more data
  const hasMore = items.length > limit;

  // Remove the extra item if present
  const data = hasMore ? items.slice(0, limit) : items;

  // Generate next cursor from last item
  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    nextCursor = encodeCursor({
      id: lastItem.id,
      createdAt: lastItem.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  }

  return {
    data,
    has_more: hasMore,
    next_cursor: nextCursor,
  };
}

// ============================================
// REACTIVE PAGINATION (Real-time updates)
// ============================================

/**
 * For real-time or frequently updated data, use a slightly
 * different approach that handles insertions between cursors
 */
export function buildRealtimePaginationArgs(
  cursorString?: string,
  limit: number = 20
): {
  skip?: number;
  cursor?: { id: string; createdAt: Date };
  take: number;
} {
  if (!cursorString) {
    return { take: limit + 1 };
  }

  const cursor = decodeCursor(cursorString);
  if (!cursor) {
    return { take: limit + 1 };
  }

  return {
    take: limit + 1,
    cursor: {
      id: cursor.id,
      createdAt: new Date(cursor.createdAt),
    },
    skip: 1, // Skip the cursor item itself
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================

/**
 * Example usage:
 *
 * ```typescript
 * import { buildTransactionPaginationArgs, transformToPaginatedResult } from './pagination';
 *
 * async function getTransactions(req: Request) {
 *   const { cursor, limit } = parseCursorPaginationParams(req.nextUrl.searchParams);
 *
 *   const args = buildTransactionPaginationArgs(cursor, limit);
 *
 *   const transactions = await prisma.transaction.findMany(args);
 *
 *   const result = transformToPaginatedResult(transactions, limit);
 *
 *   return NextResponse.json({
 *     success: true,
 *     data: result.data,
 *     meta: {
 *       next_cursor: result.next_cursor,
 *       has_more: result.has_more,
 *       limit,
 *     },
 *   });
 * }
 * ```
 */
