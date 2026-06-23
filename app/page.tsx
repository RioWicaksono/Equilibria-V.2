import { getFinanceService } from '@/application/services/FinanceService';
import { Wallet, TrendingUp, TrendingDown, Zap, ArrowUpRight, ArrowDownRight, Flame, TrendingUpDown, Calendar } from 'lucide-react';
import FormatCurrency from './components/FormatCurrency';
import { headers } from 'next/headers';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardBudget from './components/DashboardBudget';
import TransactionModal from './transactions/TransactionModal';
import SystemStatus from './components/SystemStatus';
import QuickActions from './components/QuickActions';
import RecentTransactions from './components/RecentTransactions';

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

  // Calculate trends (mock comparison - in real app, compare with last month)
  const trend = {
    income: summary.totalIncome > 0 ? 12.5 : 0,
    expense: summary.totalExpense > 0 ? -8.3 : 0,
    balance: summary.balance > 0 ? 5.2 : 0,
  };

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  // Calculate savings rate
  const savingsRate = summary.totalIncome > 0
    ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TransactionModal isFAB={true} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-4 shrink-0">
        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="relative">
            <span className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center font-black bg-gradient-to-br from-black via-zinc-900 to-black text-[#faff04] border border-[#faff04]/50 rounded-xl text-sm lg:text-base shadow-lg shadow-[#faff04]/10">
              E
            </span>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#09090b]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white">Dashboard</h1>
            <p className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QuickActions />
          <SystemStatus />
        </div>
      </div>

      {/* Stat Cards - Enhanced */}
      <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-3 lg:mb-4 shrink-0">
        {/* Balance Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50 border border-zinc-800/50 p-2.5 lg:p-3.5 transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center border border-teal-500/20">
                <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-teal-400" />
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] lg:text-xs font-medium ${trend.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend.balance >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend.balance)}%
              </div>
            </div>
            <p className="text-[9px] lg:text-[10px] text-zinc-500 font-medium mb-0.5">Saldo</p>
            <p className="text-sm lg:text-lg xl:text-xl font-bold text-white truncate">
              <FormatCurrency amount={summary.balance} />
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50 border border-zinc-800/50 p-2.5 lg:p-3.5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-0.5 text-[10px] lg:text-xs font-medium text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                {Math.abs(trend.income)}%
              </div>
            </div>
            <p className="text-[9px] lg:text-[10px] text-zinc-500 font-medium mb-0.5">Pemasukan</p>
            <p className="text-sm lg:text-lg xl:text-xl font-bold text-emerald-400 truncate">
              <FormatCurrency amount={summary.totalIncome} />
            </p>
          </div>
        </div>

        {/* Expense Card */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50 border border-zinc-800/50 p-2.5 lg:p-3.5 transition-all duration-300 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center border border-rose-500/20">
                <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5 text-rose-400" />
              </div>
              <div className="flex items-center gap-0.5 text-[10px] lg:text-xs font-medium text-rose-400">
                <ArrowDownRight className="w-3 h-3" />
                {Math.abs(trend.expense)}%
              </div>
            </div>
            <p className="text-[9px] lg:text-[10px] text-zinc-500 font-medium mb-0.5">Pengeluaran</p>
            <p className="text-sm lg:text-lg xl:text-xl font-bold text-rose-400 truncate">
              <FormatCurrency amount={summary.totalExpense} />
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Indicator */}
      <div className="mb-3 lg:mb-4 shrink-0">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <Flame className={`w-5 h-5 lg:w-6 lg:h-6 ${savingsRate > 20 ? 'text-emerald-400' : savingsRate > 0 ? 'text-amber-400' : 'text-rose-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs lg:text-sm font-semibold text-white">Tingkat Tabungan</p>
                  <span className={`text-[10px] lg:text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    savingsRate > 20 ? 'bg-emerald-500/20 text-emerald-400'
                    : savingsRate > 0 ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {savingsRate > 20 ? 'Sehat' : savingsRate > 0 ? 'Perlu Perbaikan' : 'Defisit'}
                  </span>
                </div>
                <p className="text-[10px] lg:text-xs text-zinc-400 mt-0.5">
                  {savingsRate > 20
                    ? 'Bagus! Anda menabung lebih dari 20%'
                    : savingsRate > 0
                    ? 'Target ideal adalah 20% dari pemasukan'
                    : 'Pengeluaran melebihi pemasukan'}
                </p>
              </div>
            </div>
            <div className="relative w-20 h-20 lg:w-24 lg:h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#27272a" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={savingsRate > 20 ? '#34d399' : savingsRate > 0 ? '#fbbf24' : '#fb7185'}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(savingsRate * 2.83, 283)} 283`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg lg:text-xl font-bold ${savingsRate > 20 ? 'text-emerald-400' : savingsRate > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {savingsRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Calendar & Budget */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-2 lg:gap-3 xl:gap-4">
        {/* Calendar */}
        <div className="min-h-0 flex flex-1 sm:flex-[1.1] animate-fade-in">
          <div className="relative group rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50 border border-zinc-800/50 h-full w-full flex flex-col overflow-hidden transition-all duration-300 hover:border-teal-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative p-3 sm:p-4 xl:p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 lg:mb-3 shrink-0">
                <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" />
                  Kalender
                </h3>
                <div className="flex items-center gap-3 text-[10px] lg:text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-teal-500/50" /> Reminder
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-zinc-700" /> Transaksi
                  </span>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center">
                <DashboardCalendar transactions={transactions} />
              </div>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="min-h-0 flex flex-1 sm:flex-[1.4] animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="relative group rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50 border border-zinc-800/50 h-full w-full flex flex-col overflow-hidden transition-all duration-300 hover:border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative h-full">
              <DashboardBudget budgets={budgets} categoryTotals={categoryTotals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
