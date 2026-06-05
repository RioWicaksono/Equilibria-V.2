'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Target, PiggyBank, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { useSettings } from '../contexts/SettingsContext';
import { ALL_DEFAULT_CATEGORIES, getCategoryById } from '@/domain/value-objects/TransactionCategory';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency?: string;
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

interface StatisticsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  healthScore: number;
  monthlyData: Array<{ month: string; income: number; expense: number }>;
  categoryData: Array<{ name: string; value: number; color: string; icon: string }>;
  cashFlow: Array<{ month: string; balance: number }>;
  incomeVsExpense: { income: number; expense: number };
}

export default function StatisticsPage() {
  const { formatCurrency } = useSettings();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data
      const [transRes, walletRes, goalRes, debtRes] = await Promise.all([
        fetch('/api/transactions').then(r => r.json()).catch(() => ({ transactions: [] })),
        fetch('/api/wallets').then(r => r.json()).catch(() => ({ wallets: [] })),
        fetch('/api/goals').then(r => r.json()).catch(() => ({ goals: [] })),
        fetch('/api/debts').then(r => r.json()).catch(() => ({ debts: [] })),
      ]);

      // Fallback to localStorage
      let allTrans = transRes.transactions || [];
      if (allTrans.length === 0) {
        const stored = localStorage.getItem('equilibria_transactions');
        if (stored) allTrans = JSON.parse(stored);
      }

      let allWallets = walletRes.wallets || [];
      if (allWallets.length === 0) {
        const stored = localStorage.getItem('equilibria_wallets');
        if (stored) allWallets = JSON.parse(stored);
      }

      let allGoals = goalRes.goals || [];
      if (allGoals.length === 0) {
        const stored = localStorage.getItem('equilibria_goals');
        if (stored) allGoals = JSON.parse(stored);
      }

      let allDebts = debtRes.debts || [];
      if (allDebts.length === 0) {
        const stored = localStorage.getItem('equilibria_debts');
        if (stored) allDebts = JSON.parse(stored);
      }

      setTransactions(allTrans);
      setWallets(allWallets);
      setGoals(allGoals);
      setDebts(allDebts);

      // Calculate statistics
      const calculatedStats = calculateStatistics(allTrans, allWallets, allGoals, allDebts, timeRange);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (trans: Transaction[], wallets: Wallet[], goals: Goal[], debts: Debt[], range: string) => {
    // Filter by time range
    const now = new Date();
    let startDate = new Date();

    if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredTrans = trans.filter(t => new Date(t.date) >= startDate);

    // Calculate totals
    const totalIncome = filteredTrans
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTrans
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Calculate health score (0-100)
    const debtTotal = debts.filter(d => d.type === 'DEBT').reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    let healthScore = 50;
    if (totalIncome > 0) {
      const expenseRatio = totalExpense / totalIncome;
      if (expenseRatio < 0.5) healthScore += 20;
      else if (expenseRatio < 0.7) healthScore += 10;
      else if (expenseRatio > 0.9) healthScore -= 20;
      else healthScore -= 5;
    }
    if (balance > totalIncome * 3) healthScore += 15;
    if (debtTotal > balance) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Monthly data
    const monthlyData = generateMonthlyData(filteredTrans);

    // Category breakdown
    const categoryData = generateCategoryData(filteredTrans);

    // Cash flow
    const cashFlow = generateCashFlow(filteredTrans);

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      healthScore,
      monthlyData,
      categoryData,
      cashFlow,
      incomeVsExpense: { income: totalIncome, expense: totalExpense }
    };
  };

  const generateMonthlyData = (trans: Transaction[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = months.map(month => ({ month, income: 0, expense: 0 }));

    trans.forEach(t => {
      const monthIndex = new Date(t.date).getMonth();
      if (t.type === 'INCOME') {
        data[monthIndex].income += t.amount;
      } else {
        data[monthIndex].expense += t.amount;
      }
    });

    return data;
  };

  const generateCategoryData = (trans: Transaction[]) => {
    const categoryMap = new Map<string, number>();

    trans.filter(t => t.type === 'EXPENSE').forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

    const data = Array.from(categoryMap.entries()).map(([catId, amount]) => {
      const cat = getCategoryById(catId);
      return {
        name: cat?.name || catId,
        value: amount,
        color: cat?.color || '#6b7280',
        icon: cat?.icon || '📦'
      };
    });

    return data.sort((a, b) => b.value - a.value);
  };

  const generateCashFlow = (trans: Transaction[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    let runningBalance = 0;

    return months.map((month, index) => {
      const monthTrans = trans.filter(t => new Date(t.date).getMonth() === index);
      monthTrans.forEach(t => {
        runningBalance += t.type === 'INCOME' ? t.amount : -t.amount;
      });
      return { month, balance: runningBalance };
    });
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Sangat Baik', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (score >= 60) return { label: 'Baik', color: 'text-teal-400', bg: 'bg-teal-500/10' };
    if (score >= 40) return { label: 'Cukup', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { label: 'Perlu Perbaikan', color: 'text-rose-400', bg: 'bg-rose-500/10' };
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  const healthStatus = getHealthStatus(stats?.healthScore || 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" />
            Statistik & Analisis
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Analisis mendalam kesehatan keuangan Anda.</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-teal-500 text-black'
                  : 'bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800'
              }`}
            >
              {range === 'week' ? '7 Hari' : range === 'month' ? '1 Bulan' : '1 Tahun'}
            </button>
          ))}
        </div>
      </header>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-zinc-500 uppercase">Total Saldo</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats?.balance || 0)}</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-xs text-zinc-500 uppercase">Total Pemasukan</span>
          </div>
          <p className="text-2xl font-bold text-teal-400">{formatCurrency(stats?.totalIncome || 0)}</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xs text-zinc-500 uppercase">Total Pengeluaran</span>
          </div>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(stats?.totalExpense || 0)}</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${healthStatus.bg}`}>
              {stats?.healthScore && stats.healthScore >= 60 ? (
                <CheckCircle className={`w-4 h-4 ${healthStatus.color}`} />
              ) : (
                <AlertTriangle className={`w-4 h-4 ${healthStatus.color}`} />
              )}
            </div>
            <span className="text-xs text-zinc-500 uppercase">Skor Kesehatan</span>
          </div>
          <p className={`text-2xl font-bold ${healthStatus.color}`}>{stats?.healthScore?.toFixed(0) || 0}</p>
          <p className="text-xs text-zinc-500 mt-1">{healthStatus.label}</p>
        </div>
      </div>

      {/* Savings Rate & Net Worth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-teal-400" />
              Rasio Tabungan
            </h3>
            <span className={`text-2xl font-bold ${(stats?.savingsRate || 0) > 20 ? 'text-emerald-400' : (stats?.savingsRate || 0) > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {(stats?.savingsRate || 0).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-[#1A1A1A] h-4 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                (stats?.savingsRate || 0) > 20 ? 'bg-emerald-500' : (stats?.savingsRate || 0) > 0 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, stats?.savingsRate || 0))}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {(stats?.savingsRate || 0) > 20 ? '💰 Target tabungan tercapai!' : (stats?.savingsRate || 0) > 0 ? '📈 Bisa lebih baik lagi' : '⚠️ Pengeluaran melebihi pemasukan'}
          </p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Wallet className="w-5 h-5 text-blue-400" />
            Net Worth
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total Aset (Saldo Dompet)</span>
              <span className="text-sm font-medium text-emerald-400">+ {formatCurrency(stats?.balance || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total Kewajiban (Hutang)</span>
              <span className="text-sm font-medium text-rose-400">- {formatCurrency(debts.filter(d => d.type === 'DEBT').reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0))}</span>
            </div>
            <div className="border-t border-[#262626] pt-4 flex justify-between items-center">
              <span className="text-sm font-medium text-white">Net Worth</span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(stats?.balance || 0 - debts.filter(d => d.type === 'DEBT').reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Pemasukan vs Pengeluaran</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyData}>
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `Rp${(v/1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Distribusi Pengeluaran per Kategori</h3>
          {stats?.categoryData && stats.categoryData.length > 0 ? (
            <div className="h-64 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData.slice(0, 6)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {stats.categoryData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {stats.categoryData.slice(0, 6).map((cat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-zinc-300 flex-1 truncate">{cat.icon} {cat.name}</span>
                    <span className="text-xs text-zinc-500">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
              Belum ada data pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Cash Flow Trend Line Chart */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          Tren Arus Kas
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.cashFlow}>
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `Rp${(v/1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke="#2dd4bf"
                strokeWidth={3}
                dot={{ fill: '#2dd4bf', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#faff04' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goals Progress */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          Progress Target Tabungan
        </h3>
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              return (
                <div key={goal.id} className="bg-[#1A1A1A] border border-[#262626] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-white text-sm">{goal.name}</h4>
                    <span className="text-xs font-bold text-teal-400">{percentage}%</span>
                  </div>
                  <div className="w-full bg-[#0A0A0A] h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-zinc-500 py-8">Belum ada target tabungan</p>
        )}
      </div>
    </div>
  );
}