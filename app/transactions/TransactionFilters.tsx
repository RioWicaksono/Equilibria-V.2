'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Calendar, RefreshCw } from 'lucide-react';
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

interface TransactionFiltersProps {
  transactions: Transaction[];
  onFilteredChange: (filtered: Transaction[]) => void;
}

export default function TransactionFilters({ transactions, onFilteredChange }: TransactionFiltersProps) {
  const { formatCurrency } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchDescription = t.description?.toLowerCase().includes(query);
        const matchCategory = t.category?.toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query);
        if (!matchDescription && !matchCategory && !matchAmount) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      // Date range filter
      if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.date) > new Date(dateTo + 'T23:59:59')) return false;

      return true;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    onFilteredChange(filteredTransactions);
  }, [filteredTransactions, onFilteredChange]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 placeholder-zinc-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? 'bg-teal-500 text-black'
              : 'bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter
          {hasActiveFilters && (
            <span className="bg-black/20 px-1.5 py-0.5 rounded text-xs">
              {[typeFilter !== 'ALL', categoryFilter !== 'ALL', !!dateFrom, !!dateTo].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800 transition-colors"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jenis</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">Semua Kategori</option>
                {ALL_DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500 [color-scheme:dark]"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          Menampilkan <span className="text-white font-medium">{filteredTransactions.length}</span> dari{' '}
          <span className="text-white font-medium">{transactions.length}</span> transaksi
        </span>
        {hasActiveFilters && (
          <span className="text-teal-400">
            Filter aktif
          </span>
        )}
      </div>
    </div>
  );
}