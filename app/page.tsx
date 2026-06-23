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
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04]/50 rounded-lg text-xs shadow-md shrink-0">
            E
          </span>
          <div>
            <h1 className="text-sm font-bold text-white">Dashboard</h1>
            <p className="text-[10px] text-zinc-500">Ringkasan keuangan</p>
          </div>
        </div>
        <SystemStatus />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 mb-2 shrink-0">
        <div className="card p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Saldo</span>
          </div>
          <p className="text-base font-bold text-white truncate">
            <FormatCurrency amount={summary.balance} />
          </p>
        </div>

        <div className="card p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Pemasukan</span>
          </div>
          <p className="text-base font-bold text-emerald-400 truncate">
            <FormatCurrency amount={summary.totalIncome} />
          </p>
        </div>

        <div className="card p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Pengeluaran</span>
          </div>
          <p className="text-base font-bold text-rose-400 truncate">
            <FormatCurrency amount={summary.totalExpense} />
          </p>
        </div>
      </div>

      {/* Calendar & Budget - Takes remaining space */}
      <div className="flex-1 min-h-0 grid grid-cols-5 gap-2">
        <div className="xl:col-span-2 min-h-0 flex">
          <div className="card p-2 h-full w-full flex flex-col">
            <h3 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5 shrink-0">
              <span>📅</span> Kalender
            </h3>
            <div className="flex-1 min-h-0 overflow-hidden">
              <DashboardCalendar transactions={transactions} />
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 min-h-0 flex">
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>
    </div>
  );
}
