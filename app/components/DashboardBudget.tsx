'use client';

import { useState } from 'react';
import { Target, Plus, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Budget } from '@/src/application/use-cases/FinanceService';

interface DashboardBudgetProps {
  budgets: Budget[];
  categoryTotals: Record<string, number>;
}

export default function DashboardBudget({ budgets, categoryTotals }: DashboardBudgetProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ category: '', limit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!formData.category || !formData.limit) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          limit: Number(formData.limit.replace(/\D/g, '')),
        }),
      });
      setIsAdding(false);
      setFormData({ category: '', limit: '' });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatIDR = (amount: number) => 'Rp ' + amount.toLocaleString('id-ID');

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 h-full flex flex-col" role="region" aria-label="Pelacakan Anggaran Bulanan">
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <h3 className="text-lg font-bold text-white">Anggaran Kategori</h3>
        </div>
        {!isAdding && (
          <button 
            aria-label="Tambah Limit Anggaran"
            onClick={() => setIsAdding(true)} 
            className="p-1.5 bg-zinc-800 text-zinc-300 hover:text-indigo-400 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4 flex-1" role="list">
        {budgets.length === 0 && !isAdding && (
          <div className="text-center text-sm text-zinc-500 py-4">Belum ada anggaran bulanan yang diatur.</div>
        )}
        
        {budgets.map((budget) => {
          const spent = categoryTotals[budget.category] || 0;
          const progress = Math.min((spent / budget.limit) * 100, 100);
          const isNearLimit = progress >= 80;
          const isOverLimit = progress >= 100;
          
          return (
            <div key={budget.id} role="listitem" className="p-4 rounded-lg border border-zinc-800/50 bg-[#1A1A1A]">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-zinc-200">{budget.category}</span>
                <span className="text-xs text-zinc-400 font-medium">
                  {formatIDR(spent)} / {formatIDR(budget.limit)}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div 
                  className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {isNearLimit && (
                <div className={`mt-2 text-[10px] flex items-center gap-1 font-medium ${isOverLimit ? 'text-rose-400' : 'text-amber-400'}`} role="alert">
                  <AlertTriangle className="w-3 h-3" />
                  {isOverLimit ? 'Batas anggaran terlampaui!' : 'Hampir mendekati limit anggaran.'}
                </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-3 mt-4" role="form" aria-label="Formulir atur anggaran">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-white">Atur Limit Bulanan</h4>
              <button aria-label="Batal setur anggaran" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
            </div>
            <input 
              aria-label="Kategori transaksi"
              type="text" placeholder="Kategori (Misal: Makan)" 
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded text-sm p-2 focus:border-indigo-500 outline-none"
            />
            <input 
              aria-label="Nominal limit maksimal"
              type="text" placeholder="Nominal limit maksimal" 
              value={formData.limit} onChange={e => setFormData({...formData, limit: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded text-sm p-2 focus:border-indigo-500 outline-none"
            />
            <button 
              aria-label={isSubmitting ? "Sedang Menyimpan..." : "Simpan Limit"}
              disabled={isSubmitting || !formData.category || !formData.limit}
              onClick={handleSave} 
              className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded disabled:opacity-50"
            >
              Simpan Limit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
