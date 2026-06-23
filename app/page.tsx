import { getFinanceService } from '@/application/services/FinanceService';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import FormatCurrency from './components/FormatCurrency';
import { headers } from 'next/headers';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardBudget from './components/DashboardBudget';
import TransactionModal from './transactions/TransactionModal';
import SystemStatus from './components/SystemStatus';

interface Summary {
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

export default async function DashboardPage() {
  await headers();
  const financeService = getFinanceService();
  const summary = await financeService.getSummary() as Summary;
  const transactions = await financeService.getTransactions();
  const budgets = await financeService.getBudgets();

  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TransactionModal isFAB={true} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 lg:mb-3 shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <span className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04]/50 rounded-lg text-xs lg:text-sm shadow-md shrink-0">
            E
          </span>
          <div>
            <h1 className="text-xs sm:text-sm lg:text-base font-bold text-white">Dashboard</h1>
            <p className="text-[9px] sm:text-[10px] lg:text-xs text-zinc-500">Ringkasan keuangan</p>
          </div>
        </div>
        <div className="shrink-0">
          <SystemStatus />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-2 lg:mb-3 shrink-0">
        <div className="card p-2 lg:p-3">
          <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400" />
            </div>
            <span className="text-[10px] lg:text-xs text-zinc-400 font-medium">Saldo</span>
          </div>
          <p className="text-sm lg:text-lg font-bold text-white truncate">
            <FormatCurrency amount={summary.balance} />
          </p>
        </div>

        <div className="card p-2 lg:p-3">
          <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] lg:text-xs text-zinc-400 font-medium">Pemasukan</span>
          </div>
          <p className="text-sm lg:text-lg font-bold text-emerald-400 truncate">
            <FormatCurrency amount={summary.totalIncome} />
          </p>
        </div>

        <div className="card p-2 lg:p-3">
          <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-rose-400" />
            </div>
            <span className="text-[10px] lg:text-xs text-zinc-400 font-medium">Pengeluaran</span>
          </div>
          <p className="text-sm lg:text-lg font-bold text-rose-400 truncate">
            <FormatCurrency amount={summary.totalExpense} />
          </p>
        </div>
      </div>

      {/* Calendar & Budget - Wider layout */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-2 lg:gap-3 xl:gap-4">
        {/* Calendar - Takes more width on desktop */}
        <div className="min-h-0 flex flex-1 sm:flex-[1.2] animate-fade-in">
          <div className="card p-2 sm:p-3 xl:p-4 h-full w-full flex flex-col overflow-hidden">
            <h3 className="text-xs lg:text-sm font-semibold text-white mb-1.5 lg:mb-2 flex items-center gap-1.5 lg:gap-2 shrink-0">
              <span>📅</span> Kalender
            </h3>
            <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center">
              <DashboardCalendar transactions={transactions} />
            </div>
          </div>
        </div>

        {/* Budget - Takes more width on desktop */}
        <div className="min-h-0 flex flex-1 sm:flex-[1.5] animate-fade-in" style={{ animationDelay: '100ms' }}>
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>
    </div>
  );
}
