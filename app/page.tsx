import { getFinanceService } from '@/application/services/FinanceService';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardBudget from './components/DashboardBudget';
import SystemStatus from './components/SystemStatus';
import LockButton from './components/LockButton';
import TransactionModal from './transactions/TransactionModal';
import FormatCurrency from './components/FormatCurrency';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await headers();
  const financeService = getFinanceService();
  const summary = await financeService.getSummary();
  const transactions = await financeService.getTransactions();
  const budgets = await financeService.getBudgets();

  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  return (
    <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative w-full min-w-0 overflow-hidden pb-4">
      <TransactionModal isFAB={true} />

      {/* Compact Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold text-white">Ringkasan Keuangan</h2>
          <p className="text-[10px] sm:text-xs text-zinc-500">Laporan otomatis harian</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LockButton />
          <SystemStatus />
        </div>
      </header>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3 flex flex-col justify-between min-h-[70px] sm:min-h-[80px]">
          <span className="text-zinc-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Saldo
          </span>
          <span className="text-sm sm:text-lg md:text-xl font-bold text-white truncate block">
            <FormatCurrency amount={summary.balance} />
          </span>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3 flex flex-col justify-between min-h-[70px] sm:min-h-[80px]">
          <span className="text-teal-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> Masuk
          </span>
          <span className="text-sm sm:text-lg md:text-xl font-bold text-teal-400 truncate block">
            <FormatCurrency amount={summary.totalIncome} />
          </span>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3 flex flex-col justify-between min-h-[70px] sm:min-h-[80px]">
          <span className="text-rose-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3" /> Keluar
          </span>
          <span className="text-sm sm:text-lg md:text-xl font-bold text-rose-500 truncate block">
            <FormatCurrency amount={summary.totalExpense} />
          </span>
        </div>
      </div>

      {/* Calendar& Budget - Side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Calendar Section - Compact */}
        <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-2">Kalender</h3>
          <div className="w-full flex justify-center">
            <DashboardCalendar transactions={transactions} />
          </div>
        </div>

        {/* Budget Section - Compact */}
        <div>
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>
    </div>
  );
}