'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, X, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { ALL_DEFAULT_CATEGORIES } from '@/domain/value-objects/TransactionCategory';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
}

export default function BudgetsPage() {
  const { formatCurrency } = useSettings();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ categoryId: '', limit: '', period: 'monthly' as 'weekly' | 'monthly' });
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();

      if (data.budgets && data.budgets.length > 0) {
        setBudgets(data.budgets);
      } else {
        const stored = localStorage.getItem('equilibria_budgets');
        if (stored) {
          setBudgets(JSON.parse(stored));
        }
      }
    } catch {
      const stored = localStorage.getItem('equilibria_budgets');
      if (stored) setBudgets(JSON.parse(stored));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.categoryId || !formData.limit) return;
    setIsSaving(true);

    const limitVal = parseFloat(formData.limit.replace(/\D/g, '')) || 0;
    const category = ALL_DEFAULT_CATEGORIES.find(c => c.id === formData.categoryId);

    if (!category) {
      setIsSaving(false);
      return;
    }

    const budgetData = {
      categoryId: formData.categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      limit: limitVal,
      period: formData.period
    };

    try {
      const url = editingBudget ? `/api/budgets?id=${editingBudget.id}` : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData),
      });

      const data = await res.json();

      if (editingBudget) {
        const updated = budgets.map(b => b.id === editingBudget.id ? data.budget || { ...editingBudget, ...budgetData } : b);
        setBudgets(updated);
        localStorage.setItem('equilibria_budgets', JSON.stringify(updated));
      } else {
        const newBudget = data.budget || { ...budgetData, id: Date.now().toString(), spent: 0 };
        const updated = [...budgets, newBudget];
        setBudgets(updated);
        localStorage.setItem('equilibria_budgets', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingBudget(null);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      const updated = budgets.filter(b => b.id !== id);
      setBudgets(updated);
      localStorage.setItem('equilibria_budgets', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
    setDeletingId(null);
  };

  const openEditModal = (budget: BudgetItem) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      limit: budget.limit.toString(),
      period: budget.period
    });
    setIsModalOpen(true);
  };

  const getTotalBudget = () => budgets.reduce((sum, b) => sum + b.limit, 0);
  const getTotalSpent = () => budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-teal-400" />
            Pengelolaan Budget
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Atur batas pengeluaran per kategori untuk mengontrol keuangan Anda.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ categoryId: '', limit: '', period: 'monthly' });
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Budget
        </button>
      </header>

      {/* Summary Card */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Total Budget</h3>
            <p className="text-xs text-zinc-500">Pengeluaran bulan ini</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatCurrency(getTotalSpent())}</p>
            <p className="text-xs text-zinc-500">dari {formatCurrency(getTotalBudget())}</p>
          </div>
        </div>
        <div className="w-full bg-[#1A1A1A] h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              getTotalSpent() > getTotalBudget() ? 'bg-rose-500' : 'bg-teal-500'
            }`}
            style={{ width: `${Math.min(100, (getTotalSpent() / getTotalBudget()) * 100)}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-dashed border-[#262626] rounded-xl">
          <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400">Belum ada budget</h3>
          <p className="text-sm text-zinc-500 mt-2">Tambahkan budget untuk mengontrol pengeluaran Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => {
            const percentage = Math.min(100, (budget.spent / budget.limit) * 100);
            const isOverBudget = budget.spent > budget.limit;

            return (
              <div
                key={budget.id}
                className={`bg-[#141414] border rounded-xl p-5 relative overflow-hidden group hover:border-teal-500/50 transition-colors ${
                  isOverBudget ? 'border-rose-500/30' : 'border-[#262626]'
                }`}
              >
                {/* Over Budget Indicator */}
                {isOverBudget && (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    OVER BUDGET
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${budget.categoryColor}20` }}
                    >
                      {budget.categoryIcon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{budget.categoryName}</h4>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        {budget.period === 'weekly' ? ' Mingguan' : ' Bulanan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(budget.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-zinc-400">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </span>
                    <span className={`text-xs font-bold ${isOverBudget ? 'text-rose-400' : 'text-teal-400'}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        percentage > 100 ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>

                {isOverBudget && (
                  <div className="flex items-center gap-1 text-rose-400 text-xs mt-2">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Melebihi budget {formatCurrency(budget.spent - budget.limit)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingBudget ? 'Edit Budget' : 'Tambah Budget Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Kategori</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500"
                    disabled={!!editingBudget}
                  >
                    <option value="">Pilih Kategori</option>
                    {ALL_DEFAULT_CATEGORIES.filter(c => c.type === 'EXPENSE').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Limit Budget</label>
                  <input
                    type="text"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') })}
                    placeholder="Contoh: 2000000"
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as 'weekly' | 'monthly' })}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-500"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="weekly">Mingguan</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.categoryId || !formData.limit}
                  className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hapus Budget?</h3>
                  <p className="text-sm text-zinc-400 mt-2">Aksi ini tidak dapat dibatalkan.</p>
                </div>
                <div className="flex w-full gap-3 pt-4">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-white font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(deletingId)}
                    className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}