'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Target, PiggyBank, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { useSettings } from '../contexts/SettingsContext';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

interface Debt {
  id: string;
  name: string;
  amount: number;
  paidAmount: number;
  type: 'DEBT' | 'LOAN';
  dueDate?: string;
}

export default function StatisticsPage() {
  const { formatCurrency } = useSettings();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<{ totalIncome: number; totalExpense: number; balance: number; savingsRate: number; healthScore: number; monthlyData: Array<{ month: string; income: number; expense: number }>; categoryData: Array<{ name: string; value: number; color: string }>; cashFlow: Array<{ month: string; balance: number }>; incomeVsExpense: { income: number; expense: number } } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const transRes = await fetch('/api/transactions').then(r => r.json()).catch(() => ({ transactions: [] }));
      const goalRes = await fetch('/api/goals').then(r => r.json()).catch(() => ({ goals: [] }));
      const debtRes = await fetch('/api/debts').then(r => r.json()).catch(() => ({ debts: [] }));

      let allTrans: Transaction[] = transRes.transactions || [];
      if (!allTrans.length) {
        const stored = localStorage.getItem('equilibria_transactions');
        if (stored) allTrans = JSON.parse(stored);
      }

      setGoals(goalRes.goals || []);
      setDebts(debtRes.debts || []);

      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredTrans = allTrans.filter((t: Transaction) => new Date(t.date) >= startDate);

      const totalIncome = filteredTrans.filter((t: Transaction) => t.type === 'INCOME').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const totalExpense = filteredTrans.filter((t: Transaction) => t.type === 'EXPENSE').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

      const categoryMap: Record<string, number> = {};
      filteredTrans.filter((t: Transaction) => t.type === 'EXPENSE').forEach((t: Transaction) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

      const colors = ['#2DD4BF', '#14B8A6', '#0D9488', '#0F766E', '#115E59', '#134E4A', '#042F2E', '#124236', '#11553A', '#166534'];
      const categoryData = Object.entries(categoryMap).map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length]
      }));

      const monthlyData = [];
      const months = timeRange === 'year' ? 12 : timeRange === 'month' ? 4 : 7;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now);
        if (timeRange === 'year') {
          d.setMonth(d.getMonth() - i);
          d.setDate(1);
        } else if (timeRange === 'month') {
          d.setDate(d.getDate() - i * 7);
        } else {
          d.setDate(d.getDate() - i);
        }

        const monthStr = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        const monthIncome = filteredTrans.filter((t: Transaction) => {
          const td = new Date(t.date);
          return t.type === 'INCOME' && td.toDateString() === d.toDateString();
        }).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const monthExpense = filteredTrans.filter((t: Transaction) => {
          const td = new Date(t.date);
          return t.type === 'EXPENSE' && td.toDateString() === d.toDateString();
        }).reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        monthlyData.push({ month: monthStr, income: monthIncome, expense: monthExpense });
      }

      let cumulative = 0;
      const cashFlow = monthlyData.map((m: { month: string; income: number; expense: number }) => {
        cumulative += m.income - m.expense;
        return { month: m.month, balance: cumulative };
      });

      const healthScore = calculateHealthScore(totalIncome, totalExpense, savingsRate);

      setStats({ totalIncome, totalExpense, balance, savingsRate, healthScore, monthlyData, categoryData, cashFlow, incomeVsExpense: { income: totalIncome, expense: totalExpense } });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (income: number, expense: number, savingsRate: number): number => {
    let score = 50;
    if (income > 0 && expense / income < 0.7) score += 20;
    if (savingsRate > 10) score += 15;
    if (savingsRate > 20) score += 15;
    return Math.min(100, score);
  };

  const getHealthLabel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Sangat Sehat', color: 'text-emerald-400' };
    if (score >= 60) return { label: 'Sehat', color: 'text-teal-400' };
    if (score >= 40) return { label: 'Cukup', color: 'text-amber-400' };
    return { label: 'Perlu Perbaikan', color: 'text-rose-400' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
      </div>
    );
  }

  const healthInfo = stats ? getHealthLabel(stats.healthScore) : null;

  return (
    <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      {/* Compact Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">Statistik Keuangan</h2>
          <p className="text-[10px] sm:text-xs text-zinc-500">Analisis keuangan</p>
        </div>
        <div className="flex gap-1.5">
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${timeRange === range ? 'bg-teal-500 text-black' : 'bg-[#1a1a1a] text-zinc-400 hover:text-white'}`}
            >
              {range === 'week' ? 'Minggu' : range === 'month' ? 'Bulan' : 'Tahun'}
            </button>
          ))}
        </div>
      </header>

      {stats && (
        <>
          {/* Compact Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <span className="text-zinc-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-teal-400" /> Pemasukan
              </span>
              <span className="text-sm sm:text-lg font-bold text-teal-400 truncate block">{formatCurrency(stats.totalIncome)}</span>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <span className="text-zinc-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-rose-400" /> Pengeluaran
              </span>
              <span className="text-sm sm:text-lg font-bold text-rose-400 truncate block">{formatCurrency(stats.totalExpense)}</span>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <span className="text-zinc-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
                <Wallet className="h-3 w-3 text-emerald-400" /> Sisa
              </span>
              <span className={`text-sm sm:text-lg font-bold truncate block ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats.balance)}</span>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <span className="text-zinc-500 text-[9px] sm:text-[10px] font-medium uppercase flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-amber-400" /> Tabungan
              </span>
              <span className={`text-sm sm:text-lg font-bold ${stats.savingsRate >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>{stats.savingsRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Tren Keuangan</h3>
              <div className="h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData}>
                    <XAxis dataKey="month" stroke="#71717a" fontSize={9} />
                    <YAxis stroke="#71717a" fontSize={9} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: '6px', fontSize: '10px' }} labelStyle={{ color: '#e4e4e7' }} />
                    <Bar dataKey="income" fill="#2dd4bf" name="Pemasukan" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expense" fill="#f43f5e" name="Pengeluaran" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Distribusi Pengeluaran</h3>
              <div className="h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} dataKey="value" labelLine={false}>
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: '6px', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Arus Kas</h3>
            <div className="h-32 sm:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.cashFlow}>
                  <XAxis dataKey="month" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: '6px', fontSize: '10px' }} labelStyle={{ color: '#e4e4e7' }} />
                  <Line type="monotone" dataKey="balance" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 2 }} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Health Score */}
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3 flex flex-col items-center text-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#262626" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={stats.healthScore >= 60 ? '#2dd4bf' : '#f43f5e'} strokeWidth="3" strokeDasharray={`${stats.healthScore}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-base font-bold">{stats.healthScore}</span>
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold ${healthInfo?.color}`}>{healthInfo?.label}</span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500">Skor Kesehatan</span>
            </div>

            {/* Goals */}
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-400" />
                <h4 className="text-[10px] sm:text-xs font-semibold text-white">Target</h4>
              </div>
              <div className="space-y-1.5 max-h-20 sm:max-h-24 overflow-y-auto">
                {goals.length > 0 ? goals.slice(0, 3).map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="space-y-0.5">
                      <div className="flex justify-between text-[9px] sm:text-[10px]">
                        <span className="text-zinc-400 truncate mr-1">{goal.name}</span>
                        <span className="text-teal-400 whitespace-nowrap">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                      </div>
                    </div>
                  );
                }) : <p className="text-[9px] sm:text-[10px] text-zinc-500">Tidak ada target</p>}
              </div>
            </div>

            {/* Debts */}
            <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <PiggyBank className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
                <h4 className="text-[10px] sm:text-xs font-semibold text-white">Hutang</h4>
              </div>
              <div className="space-y-1.5 max-h-20 sm:max-h-24 overflow-y-auto">
                {debts.length > 0 ? debts.slice(0, 3).map((debt) => {
                  const paid = (debt.paidAmount / debt.amount) * 100;
                  return (
                    <div key={debt.id} className="space-y-0.5">
                      <div className="flex justify-between text-[9px] sm:text-[10px]">
                        <span className="text-zinc-400 truncate mr-1">{debt.name}</span>
                        <span className={debt.type === 'DEBT' ? 'text-rose-400' : 'text-teal-400'}>{formatCurrency(debt.amount - debt.paidAmount)}</span>
                      </div>
                      <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${debt.type === 'DEBT' ? 'bg-rose-400' : 'bg-teal-400'}`} style={{ width: `${paid}%` }} />
                      </div>
                    </div>
                  );
                }) : <p className="text-[9px] sm:text-[10px] text-zinc-500">Tidak ada hutang</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}