'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, CreditCard, RefreshCw, Loader2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface NetWorthData {
  success: boolean;
  error?: string;
  netWorth: number;
  breakdown: {
    assets: {
      total: number;
      liquid: {
        total: number;
        items: Array<{ id: string; name: string; balance: number; percentage: number }>;
      };
      goals: {
        total: number;
        items: Array<{
          id: string;
          name: string;
          targetAmount: number;
          currentAmount: number;
          progress: number;
          deadline: string | null;
          percentage: number;
        }>;
      };
    };
    liabilities: {
      total: number;
      items: Array<{
        id: string;
        name: string;
        type: string;
        originalAmount: number;
        remainingAmount: number;
        paidAmount: number;
        progress: number;
        dueDate: string | null;
      }>;
    };
  };
  metrics: {
    debtToAssetRatio: number;
    liquidAllocation: number;
    goalAllocation: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyChange: number;
  };
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
}

export default function NetWorthPage() {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<NetWorthData>('/api/networth');
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-400 mb-4">{error || 'Gagal memuat data'}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-teal-500 text-black rounded-lg font-semibold">
          Coba Lagi
        </button>
      </div>
    );
  }

  const { breakdown, metrics, summary, netWorth } = data;
  const isPositive = netWorth >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Net Worth</h1>
          <p className="text-sm text-zinc-500 mt-1">Ringkasan kekayaan bersih Anda</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-[#1A1A1A] border border-[#262626] rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Net Worth Card */}
      <div className={`card border-2 ${isPositive ? 'border-teal-500/30' : 'border-rose-500/30'}`}>
        <div className="text-center py-6">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Total Kekayaan Bersih
          </p>
          <p className={`text-4xl sm:text-5xl font-bold tracking-tight ${isPositive ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(netWorth)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {metrics.monthlyChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-teal-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span className={`text-sm font-medium ${metrics.monthlyChange >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {metrics.monthlyChange >= 0 ? '+' : ''}{formatCurrency(metrics.monthlyChange)}
            </span>
            <span className="text-xs text-zinc-500">bulan ini</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card group hover:border-teal-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
              <ArrowUpRight className="w-5 h-5 text-teal-400" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Total Assets</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(summary.totalAssets)}
          </p>
        </div>

        <div className="card group hover:border-rose-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
              <ArrowDownRight className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Total Liabilities</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-400">
            {formatCurrency(summary.totalLiabilities)}
          </p>
        </div>

        <div className="card group col-span-2 sm:col-span-1 hover:border-amber-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${metrics.debtToAssetRatio < 50 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <DollarSign className={`w-5 h-5 ${metrics.debtToAssetRatio < 50 ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase">Debt Ratio</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${metrics.debtToAssetRatio < 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.debtToAssetRatio}%
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {metrics.debtToAssetRatio < 50 ? 'Sehat (< 50%)' : 'Perlu perhatian'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#262626] pb-2">
        {(['overview', 'assets', 'liabilities'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-teal-500/10 text-teal-400'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {tab === 'overview' && 'Ringkasan'}
            {tab === 'assets' && 'Assets'}
            {tab === 'liabilities' && 'Liabilities'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Asset Allocation */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Asset Allocation</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Liquid (Dompet)</span>
                    <span className="text-teal-400">{metrics.liquidAllocation}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${metrics.liquidAllocation}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Goals (Target)</span>
                    <span className="text-amber-400">{metrics.goalAllocation}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${metrics.goalAllocation}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Ringkasan Bulanan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 uppercase font-medium">Pemasukan</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(metrics.monthlyIncome)}</p>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-rose-400 uppercase font-medium">Pengeluaran</span>
                  </div>
                  <p className="text-lg font-bold text-rose-400">{formatCurrency(metrics.monthlyExpense)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            {/* Liquid Assets */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Wallet className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Liquid Assets (Dompet)</h3>
                  <p className="text-xs text-zinc-500">{formatCurrency(breakdown.assets.liquid.total)}</p>
                </div>
              </div>
              <div className="space-y-3">
                {breakdown.assets.liquid.items.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Belum ada dompet</p>
                ) : (
                  breakdown.assets.liquid.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.percentage.toFixed(1)}% dari total</p>
                      </div>
                      <p className="text-sm font-bold text-teal-400">{formatCurrency(item.balance)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Goals */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Savings Goals (Target)</h3>
                  <p className="text-xs text-zinc-500">{formatCurrency(breakdown.assets.goals.total)}</p>
                </div>
              </div>
              <div className="space-y-4">
                {breakdown.assets.goals.items.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Belum ada target</p>
                ) : (
                  breakdown.assets.goals.items.map(goal => (
                    <div key={goal.id} className="py-2 border-b border-zinc-800 last:border-0">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{goal.name}</p>
                          <p className="text-xs text-zinc-500">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            {goal.deadline && ` • Due: ${formatDate(goal.deadline)}`}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-amber-400">{goal.progress.toFixed(0)}%</p>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Liabilities Tab */}
        {activeTab === 'liabilities' && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Liabilities (Hutang)</h3>
                <p className="text-xs text-zinc-500">{formatCurrency(breakdown.liabilities.total)}</p>
              </div>
            </div>
            <div className="space-y-4">
              {breakdown.liabilities.items.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  🎉 Tidak ada hutang! Keuangan Anda sehat!
                </p>
              ) : (
                breakdown.liabilities.items.map(debt => (
                  <div key={debt.id} className="py-3 border-b border-zinc-800 last:border-0">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{debt.name}</p>
                        <p className="text-xs text-zinc-500">
                          {debt.type === 'DEBT' ? 'Hutang' : 'Pinjaman'}
                          {debt.dueDate && ` • Due: ${formatDate(debt.dueDate)}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-rose-400">{formatCurrency(debt.remainingAmount)}</p>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Lunas: {formatCurrency(debt.paidAmount)}</span>
                      <span className="text-rose-400">{debt.progress.toFixed(0)}% lunas</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${debt.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
