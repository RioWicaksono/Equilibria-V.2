'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, X, AlertTriangle, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Budget } from '@/domain/entities/Budget';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardBudgetProps {
  budgets: Budget[];
  categoryTotals: Record<string, number>;
}

export default function DashboardBudget({ budgets, categoryTotals }: DashboardBudgetProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ category: '', limit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(80);
  const router = useRouter();
  const { formatCurrency } = useSettings();

  // Check for budget alerts and send notifications
  useEffect(() => {
    const checkBudgetAlerts = async () => {
      budgets.forEach((budget) => {
        const spent = categoryTotals[budget.category] || 0;
        const progress = (spent / budget.limit) * 100;
        const isNearLimit = progress >= alertThreshold;
        const isOverLimit = progress >= 100;

        // Check if we already sent this alert today
        const alertKey = `budget_alert_${budget.category}_${new Date().toISOString().split('T')[0]}`;
        const alreadyAlerted = localStorage.getItem(alertKey);

        if ((isNearLimit || isOverLimit) && !alreadyAlerted) {
          // Store that we alerted
          localStorage.setItem(alertKey, 'true');

          // Create notification message
          const remaining = budget.limit - spent;
          let message = '';
          if (isOverLimit) {
            message = `⚠️ Budget "${budget.category}" TERLAMPAUI!\nSudah habis Rp ${formatCurrency(spent)} dari limit Rp ${formatCurrency(budget.limit)}`;
          } else {
            message = `📊 Budget "${budget.category}" nearly reached (${Math.round(progress)}%)\nSisa: Rp ${formatCurrency(remaining)} dari limit Rp ${formatCurrency(budget.limit)}`;
          }

          // Try browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Equilibria - Budget Alert', {
              body: message,
              icon: '/icon.svg',
              tag: alertKey,
            });
          }

          // Try Telegram notification if configured
          const telegramToken = localStorage.getItem('equilibria_telegram_token');
          if (telegramToken) {
            fetch('/api/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message }),
            }).catch(console.error);
          }
        }
      });
    };

    // Run alert check on mount and when budgets change
    checkBudgetAlerts();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [budgets, categoryTotals, alertThreshold, formatCurrency]);

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

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg p-2 sm:p-3 h-full flex flex-col" role="region" aria-label="Pelacakan Anggaran Bulanan">
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" aria-hidden="true" />
          <h3 className="text-xs sm:text-sm font-bold text-white">Anggaran</h3>
          {budgets.some(b => {
            const spent = categoryTotals[b.category] || 0;
            return (spent / b.limit) * 100 >= alertThreshold;
          }) && (
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" title="Ada budget alert!" />
          )}
        </div>
        {!isAdding && (
          <button
            aria-label="Tambah Limit Anggaran"
            onClick={() => setIsAdding(true)}
            className="p-1 bg-zinc-800 text-zinc-300 hover:text-indigo-400 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Alert Threshold Setting */}
      <div className="mb-2 flex items-center gap-2 text-[9px] sm:text-[10px] text-zinc-500">
        <span>Alert di:</span>
        <select
          value={alertThreshold}
          onChange={(e) => setAlertThreshold(Number(e.target.value))}
          className="bg-transparent border border-zinc-700 rounded px-1 py-0.5 text-zinc-400"
        >
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={80}>80%</option>
          <option value={90}>90%</option>
          <option value={100}>100%</option>
        </select>
      </div>

      <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto max-h-[160px] sm:max-h-[180px]">
        {budgets.length === 0 && !isAdding && (
          <div className="text-center text-[10px] sm:text-xs text-zinc-500 py-4 sm:py-6">Belum ada anggaran.</div>
        )}

        {budgets.map((budget) => {
          const spent = categoryTotals[budget.category] || 0;
          const progress = Math.min((spent / budget.limit) * 100, 100);
          const isNearLimit = progress >= alertThreshold;
          const isOverLimit = progress >= 100;

          return (
            <div key={budget.id} role="listitem" className="p-2 rounded border border-zinc-800/50 bg-[#1A1A1A]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[10px] sm:text-xs text-zinc-200 truncate flex-1 mr-2">{budget.category}</span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                  {formatCurrency(spent)}/{formatCurrency(budget.limit)}
                </span>
              </div>
              <div className="h-1 sm:h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {isNearLimit && (
                <div className={`mt-1 text-[9px] sm:text-[10px] flex items-center gap-1 font-medium ${isOverLimit ? 'text-rose-400' : 'text-amber-400'}`} role="alert">
                  <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {isOverLimit ? 'Budget terlampaui!' : `${Math.round(progress)}% terpakai`}
                </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="p-2 sm:p-3 rounded border border-indigo-500/30 bg-indigo-500/5 space-y-2" role="form" aria-label="Formulir atur anggaran">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-[10px] sm:text-xs font-bold text-white">Atur Limit Bulanan</h4>
              <button aria-label="Batal" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            </div>
            <input
              aria-label="Kategori transaksi"
              type="text" placeholder="Kategori"
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded text-[10px] sm:text-xs p-1.5 sm:p-2 focus:border-indigo-500 outline-none"
            />
            <input
              aria-label="Nominal limit maksimal"
              type="text" placeholder="Nominal limit"
              value={formData.limit} onChange={e => setFormData({...formData, limit: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded text-[10px] sm:text-xs p-1.5 sm:p-2 focus:border-indigo-500 outline-none"
            />
            <button
              aria-label={isSubmitting ? "Sedang Menyimpan..." : "Simpan Limit"}
              disabled={isSubmitting || !formData.category || !formData.limit}
              onClick={handleSave}
              className="w-full py-1.5 sm:py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] sm:text-xs font-bold rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}