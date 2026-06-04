import { getFinanceService } from '@/application/services/FinanceService';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardBudget from './components/DashboardBudget';
import SystemStatus from './components/SystemStatus';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative min-h-[calc(100vh-120px)]">
      <TransactionModal isFAB={true} />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white">Ringkasan Keuangan</h2>
          <p className="text-sm text-zinc-500 mt-1">Laporan otomatis berdasarkan catatan harian Anda.</p>
        </div>
        <SystemStatus />
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-32 group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:border-zinc-700 w-full">
          <span className="text-zinc-500 text-xs font-medium uppercase mb-4 flex items-center gap-2 group-hover:text-zinc-400 transition-colors">
            <Wallet className="h-4 w-4" /> Total Saldo
          </span>
          <h3 className="text-3xl font-bold text-white group-hover:scale-[1.02] transform origin-left transition-transform duration-300">
            <FormatCurrency amount={summary.balance} />
          </h3>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-32 group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.15)] hover:border-teal-500/40 w-full">
          <span className="text-teal-400 text-xs font-medium uppercase mb-4 flex items-center gap-2 group-hover:text-teal-300 transition-colors">
            <ArrowUpRight className="h-4 w-4" /> Pemasukan
          </span>
          <h3 className="text-3xl font-bold text-teal-400 group-hover:text-teal-300 group-hover:scale-[1.02] transform origin-left transition-all duration-300">
            <FormatCurrency amount={summary.totalIncome} />
          </h3>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-32 group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-500/40 w-full">
          <span className="text-rose-500 text-xs font-medium uppercase mb-4 flex items-center gap-2 group-hover:text-rose-400 transition-colors">
            <ArrowDownRight className="h-4 w-4" /> Pengeluaran
          </span>
          <h3 className="text-3xl font-bold text-rose-500 group-hover:text-rose-400 group-hover:scale-[1.02] transform origin-left transition-all duration-300">
            <FormatCurrency amount={summary.totalExpense} />
          </h3>
        </div>
      </div>

      {/* Sub Modules: Calendar & Reminder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Kalender Transaksi</h3>
          <div className="w-full flex justify-center flex-1 items-center overflow-x-auto pb-2">
            <div className="min-w-fit">
              <DashboardCalendar transactions={transactions} />
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="h-full">
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>
    </div>
  );
}