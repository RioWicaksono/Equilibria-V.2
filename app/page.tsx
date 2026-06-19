import { getFinanceService } from '@/application/services/FinanceService';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import FormatCurrency from './components/FormatCurrency';
import { headers } from 'next/headers';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardBudget from './components/DashboardBudget';
import TransactionModal from './transactions/TransactionModal';

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

  const incomePercent = summary.totalIncome > 0 ? Math.round((summary.totalExpense / summary.totalIncome) * 100) : 0;

  return (
    <div className="relative w-full min-w-0 h-full">
      <TransactionModal isFAB={true} />

      <div className="flex items-center gap-2 mb-1">
        <span className="w-5 h-5 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded text-[9px]">
          E
        </span>
        <h1 className="text-sm font-bold text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <div className="card p-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <Wallet className="w-2.5 h-2.5 text-teal-400" />
            <span className="text-[7px] text-zinc-500 uppercase">Saldo</span>
          </div>
          <p className="text-sm font-bold text-white truncate">
            <FormatCurrency amount={summary.balance} />
          </p>
        </div>

        <div className="card p-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-teal-400" />
            <span className="text-[7px] text-zinc-500 uppercase">Masuk</span>
          </div>
          <p className="text-sm font-bold text-teal-400 truncate">
            <FormatCurrency amount={summary.totalIncome} />
          </p>
        </div>

        <div className="card p-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
            <span className="text-[7px] text-zinc-500 uppercase">Keluar</span>
          </div>
          <p className="text-sm font-bold text-rose-400 truncate">
            <FormatCurrency amount={summary.totalExpense} />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 mt-1">
        <div className="xl:col-span-2">
          <div className="card p-1">
            <h3 className="text-[9px] font-semibold text-white mb-0.5">📅 Kalender</h3>
            <DashboardCalendar transactions={transactions} />
          </div>
        </div>

        <div className="xl:col-span-3">
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>
    </div>
  );
}
