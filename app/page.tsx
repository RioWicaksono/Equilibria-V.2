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
    <div className="relative w-full min-w-0 h-full flex flex-col">
      <TransactionModal isFAB={true} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-xs">
            E
          </span>
          <h1 className="text-base font-bold text-white">Dashboard</h1>
        </div>
        <SystemStatus />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wide">Saldo</span>
          </div>
          <p className="text-lg font-bold text-white truncate">
            <FormatCurrency amount={summary.balance} />
          </p>
        </div>

        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wide">Pemasukan</span>
          </div>
          <p className="text-lg font-bold text-teal-400 truncate">
            <FormatCurrency amount={summary.totalIncome} />
          </p>
        </div>

        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wide">Pengeluaran</span>
          </div>
          <p className="text-lg font-bold text-rose-400 truncate">
            <FormatCurrency amount={summary.totalExpense} />
          </p>
        </div>
      </div>

      {/* Calendar & Budget */}
      <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
        <div className="xl:col-span-2 min-h-0">
          <div className="card p-3 h-full">
            <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
              <span>📅</span> Kalender
            </h3>
            <DashboardCalendar transactions={transactions} />
          </div>
        </div>

        <div className="xl:col-span-3 min-h-0">
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>
    </div>
  );
}
