import { NextRequest } from 'next/server';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';
import { authenticateRequest } from '@/lib/auth';

const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  ALLOWED_TYPES: ['all', 'transactions', 'categories', 'wallets', 'goals', 'debts'] as const,
};

type SearchType = typeof SEARCH_CONFIG.ALLOWED_TYPES[number];

function parseAndValidateLimit(input: string | null): number {
  const parsed = Number.parseInt(input || '', 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return SEARCH_CONFIG.DEFAULT_LIMIT;
  }
  return Math.min(parsed, SEARCH_CONFIG.MAX_LIMIT);
}

function sanitizeQuery(query: string): string {
  return query.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).substring(0, SEARCH_CONFIG.MAX_QUERY_LENGTH);
}

function isValidSearchType(type: string): type is SearchType {
  return SEARCH_CONFIG.ALLOWED_TYPES.includes(type as SearchType);
}

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const searchParams = req.nextUrl.searchParams;

    const rawQuery = searchParams.get('q')?.trim() || '';
    const rawType = searchParams.get('type') || 'all';
    const limit = parseAndValidateLimit(searchParams.get('limit'));

    if (!rawQuery || rawQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return new Response(JSON.stringify({
        success: true,
        results: { transactions: [], categories: [], wallets: [], goals: [], debts: [] },
        total: 0,
        query: '',
        pagination: { limit, hasMore: false },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

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
        include: { Wallet: true },
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

    if (type === 'all' || type === 'categories') {
      const categories = await prisma.transaction.groupBy({
        by: ['category'],
        where: { category: { contains: query, mode: 'insensitive' } },
        _count: true,
        _sum: { amount: true },
        orderBy: { _count: { category: 'desc' } },
        take: Math.min(limit, 10),
      });
      results.categories = categories.map(c => ({ name: c.category, count: c._count, totalAmount: c._sum?.amount || 0 }));
    }

    if (type === 'all' || type === 'wallets') {
      results.wallets = await prisma.wallet.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: limit,
      });
    }

    if (type === 'all' || type === 'goals') {
      results.goals = await prisma.financialGoal.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
        take: limit,
      });
    }

    if (type === 'all' || type === 'debts') {
      results.debts = await prisma.debt.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
        take: limit,
      });
    }

    const total = results.transactions.length + results.categories.length + results.wallets.length + results.goals.length + results.debts.length;

    return new Response(JSON.stringify({
      success: true,
      results,
      total,
      query,
      pagination: { limit, hasMore: total >= limit },
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[GET /api/search]', error);
    return new Response(JSON.stringify({ success: false, error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
