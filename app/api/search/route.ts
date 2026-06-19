import { NextRequest, NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

// Constants for search limits
const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50, // Prevent abuse
  ALLOWED_TYPES: ['all', 'transactions', 'categories', 'wallets', 'goals', 'debts'] as const,
};

type SearchType = typeof SEARCH_CONFIG.ALLOWED_TYPES[number];

function parseAndValidateLimit(input: string | null): number {
  const parsed = parseInt(input || '', 10);
  if (isNaN(parsed) || parsed < 1) {
    return SEARCH_CONFIG.DEFAULT_LIMIT;
  }
  return Math.min(parsed, SEARCH_CONFIG.MAX_LIMIT);
}

function sanitizeQuery(query: string): string {
  // Remove special regex characters to prevent injection
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, SEARCH_CONFIG.MAX_QUERY_LENGTH);
}

function isValidSearchType(type: string): type is SearchType {
  return SEARCH_CONFIG.ALLOWED_TYPES.includes(type as SearchType);
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Parse and validate inputs
    const rawQuery = searchParams.get('q')?.trim() || '';
    const rawType = searchParams.get('type') || 'all';
    const limit = parseAndValidateLimit(searchParams.get('limit'));

    // Validate query
    if (!rawQuery || rawQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return NextResponse.json({
        success: true,
        results: {
          transactions: [],
          categories: [],
          wallets: [],
          goals: [],
          debts: [],
        },
        total: 0,
        query: '',
        pagination: {
          limit,
          hasMore: false,
        },
      });
    }

    // Sanitize query for database safety
    const query = sanitizeQuery(rawQuery);
    const type = isValidSearchType(rawType) ? rawType : 'all';

    const results = {
      transactions: [] as any[],
      categories: [] as any[],
      wallets: [] as any[],
      goals: [] as any[],
      debts: [] as any[],
    };

    const prisma = await getPrismaAsync();

    // Search Transactions
    if (type === 'all' || type === 'transactions') {
      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: limit,
        include: {
          Wallet: true,
        },
      });
      results.transactions = transactions.map(t => ({
        id: t.id,
        type: t.type,
        category: t.category,
        description: t.description,
        amount: t.amount,
        date: t.date,
        walletId: t.walletId,
        walletName: (t.Wallet as any)?.name || 'Tanpa Dompet',
      }));
    }

    // Search Categories (from transactions)
    if (type === 'all' || type === 'categories') {
      const categories = await prisma.transaction.groupBy({
        by: ['category'],
        where: {
          category: { contains: query, mode: 'insensitive' },
        },
        _count: true,
        _sum: { amount: true },
        orderBy: { _count: { category: 'desc' } },
        take: Math.min(limit, 10), // Limit categories to 10
      });
      results.categories = categories.map(c => ({
        name: c.category,
        count: c._count,
        totalAmount: c._sum?.amount || 0,
      }));
    }

    // Search Wallets
    if (type === 'all' || type === 'wallets') {
      const wallets = await prisma.wallet.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: limit,
      });
      results.wallets = wallets;
    }

    // Search Goals
    if (type === 'all' || type === 'goals') {
      const goals = await prisma.financialGoal.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });
      results.goals = goals;
    }

    // Search Debts
    if (type === 'all' || type === 'debts') {
      const debts = await prisma.debt.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });
      results.debts = debts;
    }

    // Calculate total
    const total = results.transactions.length +
      results.categories.length +
      results.wallets.length +
      results.goals.length +
      results.debts.length;

    // Determine if there are more results
    const hasMore = total >= limit;

    return NextResponse.json({
      success: true,
      results,
      total,
      query,
      pagination: {
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[GET /api/search]', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
