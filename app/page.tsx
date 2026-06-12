import { getFinanceService } from '@/application/services/FinanceService';
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardBudget from './components/DashboardBudget';
import SystemStatus from './components/SystemStatus';
import LockButton from './components/LockButton';
import TransactionModal from './transactions/TransactionModal';
import FormatCurrency from './components/FormatCurrency';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

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

  // Calculate percentage change (mock calculation for demo)
  const incomePercent = summary.totalIncome > 0 ? Math.round((summary.totalExpense / summary.totalIncome) * 100) : 0;

  return (
    <div className="space-y-6 relative w-full min-w-0">
      <TransactionModal isFAB={true} />

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-xs">
              E
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 ml-10 sm:ml-10">Ringkasan keuangan Anda hari ini</p>
        </div>
        <div className="flex items-center gap-2">
          <LockButton />
          <SystemStatus />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Balance Card */}
        <div className="card group hover:border-teal-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
              <Wallet className="w-5 h-5 text-teal-400" />
            </div>
            <span className="badge badge-success">Total</span>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Saldo</p>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            <FormatCurrency amount={summary.balance} />
          </p>
        </div>

        {/* Income Card */}
        <div className="card group hover:border-teal-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <span className="badge badge-success">+{incomePercent}%</span>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Pemasukan</p>
          <p className="text-2xl sm:text-3xl font-bold text-teal-400 tracking-tight">
            <FormatCurrency amount={summary.totalIncome} />
          </p>
        </div>

        {/* Expense Card */}
        <div className="card group hover:border-rose-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>
            <span className="badge badge-danger">{incomePercent}%</span>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Pengeluaran</p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight">
            <FormatCurrency amount={summary.totalExpense} />
          </p>
        </div>
      </div>

      {/* Calendar & Budget Section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Calendar Section */}
        <div className="xl:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Kalender
              </h3>
              <span className="text-xs text-zinc-500">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="w-full flex justify-center">
              <DashboardCalendar transactions={transactions} />
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="xl:col-span-3">
          <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-400">Database: <span className="text-teal-400 font-medium">Connected</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg">
          <span className="text-xs text-zinc-400">Transaksi: <span className="text-white font-medium">{transactions.length}</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg">
          <span className="text-xs text-zinc-400">Budget aktif: <span className="text-white font-medium">{budgets.length}</span></span>
        </div>
      </div>
    </div>
  );
}