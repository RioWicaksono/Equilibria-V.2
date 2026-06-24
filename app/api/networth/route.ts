import { NextRequest } from 'next/server';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const prisma = await getPrismaAsync();

    const wallets = await prisma.wallet.findMany({ orderBy: { balance: 'desc' } });
    const goals = await prisma.financialGoal.findMany({ orderBy: { deadline: 'asc' } });
    const debts = await prisma.debt.findMany({ where: { status: 'UNPAID' }, orderBy: { dueDate: 'asc' } });

    const totalLiquidAssets = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalGoalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalAssets = totalLiquidAssets + totalGoalSavings;
    const totalLiabilities = debts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
    const netWorth = totalAssets - totalLiabilities;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyTransactions = await prisma.transaction.groupBy({
      by: ['type'],
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    const monthlyIncome = monthlyTransactions.find(t => t.type === 'INCOME')?._sum.amount || 0;
    const monthlyExpense = monthlyTransactions.find(t => t.type === 'EXPENSE')?._sum.amount || 0;
    const monthlyChange = monthlyIncome - monthlyExpense;

    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const liquidAllocation = totalAssets > 0 ? (totalLiquidAssets / totalAssets) * 100 : 0;
    const goalAllocation = totalAssets > 0 ? (totalGoalSavings / totalAssets) * 100 : 0;

    return new Response(JSON.stringify({
      success: true,
      netWorth,
      breakdown: {
        assets: {
          total: totalAssets,
          liquid: {
            total: totalLiquidAssets,
            items: wallets.map(w => ({
              id: w.id, name: w.name, balance: w.balance,
              percentage: totalAssets > 0 ? (w.balance / totalAssets) * 100 : 0,
            })),
          },
          goals: {
            total: totalGoalSavings,
            items: goals.map(g => ({
              id: g.id, name: g.name, targetAmount: g.targetAmount,
              currentAmount: g.currentAmount,
              progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
              deadline: g.deadline,
              percentage: totalAssets > 0 ? (g.currentAmount / totalAssets) * 100 : 0,
            })),
          },
        },
        liabilities: {
          total: totalLiabilities,
          items: debts.map(d => ({
            id: d.id, name: d.name, type: d.type,
            originalAmount: d.amount, remainingAmount: d.amount - d.paidAmount,
            paidAmount: d.paidAmount,
            progress: d.amount > 0 ? (d.paidAmount / d.amount) * 100 : 0,
            dueDate: d.dueDate,
          })),
        },
      },
      metrics: {
        debtToAssetRatio: Math.round(debtToAssetRatio * 10) / 10,
        liquidAllocation: Math.round(liquidAllocation * 10) / 10,
        goalAllocation: Math.round(goalAllocation * 10) / 10,
        monthlyIncome, monthlyExpense, monthlyChange,
      },
      summary: { totalAssets, totalLiabilities, netWorth },
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[GET /api/networth]', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to calculate net worth' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
