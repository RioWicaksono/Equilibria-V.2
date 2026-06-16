import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { getFinanceService } from '@/application/services/FinanceService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const financeService = getFinanceService();
    const transactions = await financeService.getTransactions();
    const budgets = await financeService.getBudgets();

    // Filter transactions for the month
    const monthTransactions = transactions.filter(t => {
      const tMonth = new Date(t.date).toISOString().slice(0, 7);
      return tMonth === month;
    });

    // Calculate summary
    const totalIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

    // Budget status
    const budgetStatus = budgets.map(b => {
      const spent = categoryBreakdown[b.category] || 0;
      const percentage = Math.round((spent / b.limit) * 100);
      return {
        category: b.category,
        limit: b.limit,
        spent,
        percentage,
        status: percentage >= 100 ? 'OVER' : percentage >= 80 ? 'WARNING' : 'OK'
      };
    });

    const monthName = new Date(month + '-01').toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });

    return ApiResponse.ok({
      success: true,
      month,
      summary: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: monthTransactions.length,
        categories: categoryBreakdown,
        budgets: budgetStatus
      },
      monthName
    });
  } catch (error) {
    logger.error('[GET /api/summary]', { error });
    return ApiResponse.internalError('Failed to generate summary');
  }
}

// Send summary to Telegram
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramToken) {
      return ApiResponse.badRequest('Telegram bot token not configured');
    }

    const financeService = getFinanceService();
    const transactions = await financeService.getTransactions();

    const monthTransactions = transactions.filter(t => {
      const tMonth = new Date(t.date).toISOString().slice(0, 7);
      return tMonth === month;
    });

    const totalIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const monthName = new Date(month + '-01').toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });

    let message = `📊 *Ringkasan Keuangan*\n*${monthName}*\n\n`;
    message += `💰 Masuk: ${formatCurrency(totalIncome)}\n`;
    message += `💸 Keluar: ${formatCurrency(totalExpense)}\n`;
    message += `📈 Saldo: ${formatCurrency(totalIncome - totalExpense)}\n`;
    message += `\n📝 Total transaksi: ${monthTransactions.length}`;

    // Send to Telegram
    const chatId = searchParams.get('chatId');
    if (chatId) {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    return ApiResponse.ok({ success: true, message: 'Summary sent to Telegram' });
  } catch (error) {
    logger.error('[POST /api/summary]', { error });
    return ApiResponse.internalError('Failed to send summary');
  }
}