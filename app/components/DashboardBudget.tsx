'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Bell } from 'lucide-react';
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
  const [telegramToken, setTelegramToken] = useState('');
  const router = useRouter();
  const { formatCurrency } = useSettings();

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.telegramToken) {
          setTelegramToken(data.settings.telegramToken);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkBudgetAlerts = async () => {
      budgets.forEach((budget) => {
        const spent = categoryTotals[budget.category] || 0;
        const progress = (spent / budget.limit) * 100;
        const isNearLimit = progress >= alertThreshold;
        const isOverLimit = progress >= 100;

        const alertKey = `budget_alert_${budget.category}_${new Date().toISOString().split('T')[0]}`;
        const alreadyAlerted = sessionStorage.getItem(alertKey);

        if ((isNearLimit || isOverLimit) && !alreadyAlerted) {
          sessionStorage.setItem(alertKey, 'true');

          const remaining = budget.limit - spent;
          let message = '';
          if (isOverLimit) {
            message = `⚠️ Budget "${budget.category}" TERLAMPAUI!\nSudah Rp ${formatCurrency(spent)} dari limit Rp ${formatCurrency(budget.limit)}`;
          } else {
            message = `📊 Budget "${budget.category}" nearly reached (${Math.round(progress)}%)\nSisa: Rp ${formatCurrency(remaining)}`;
          }

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Equilibria - Budget Alert', {
              body: message,
              icon: '/icon.svg',
              tag: alertKey,
            });
          }

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

    checkBudgetAlerts();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [budgets, categoryTotals, alertThreshold, formatCurrency, telegramToken]);

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

  const hasAlert = budgets.some(b => {
    const spent = categoryTotals[b.category] || 0;
    return (spent / b.limit) * 100 >= alertThreshold;
  });

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 h-full" role="region" aria-label="Pelacakan Anggaran Bulanan">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h3 className="text-xs font-bold text-white">Anggaran Bulanan</h3>
          {hasAlert && (
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          )}
        </div>
        {!isAdding && (
          <button
            aria-label="Tambah Budget"
            onClick={() => setIsAdding(true)}
            className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-28 overflow-y-auto">
        {budgets.length === 0 && !isAdding && (
          <div className="text-center text-xs text-zinc-500 py-4">
            Belum ada anggaran bulanan.<br />
            <span className="text-[10px]">Klik + untuk menambahkan</span>
          </div>
        )}

        {budgets.map((budget) => {
          const spent = categoryTotals[budget.category] || 0;
          const progress = Math.min((spent / budget.limit) * 100, 100);
          const isNearLimit = progress >= alertThreshold;
          const isOverLimit = progress >= 100;

          return (
            <div key={budget.id} className="space-y-1.5 p-2 rounded-lg bg-[#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-200 truncate">{budget.category}</span>
                <span className={`text-xs font-bold ${isOverLimit ? 'text-rose-400' : isNearLimit ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>Rp {formatCurrency(spent)}</span>
                <span>Rp {formatCurrency(budget.limit)}</span>
              </div>
            </div>
          );
        })}

        {isAdding && (
          <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama kategori"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="flex-1 bg-[#1A1A1A] border border-[#262626] text-white rounded-lg text-xs p-2 focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                placeholder="Limit"
                value={formData.limit}
                onChange={e => setFormData({...formData, limit: e.target.value.replace(/\D/g, '')})}
                className="w-28 bg-[#1A1A1A] border border-[#262626] text-white rounded-lg text-xs p-2 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-1.5 text-xs text-zinc-400 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Batal
              </button>
              <button
                disabled={isSubmitting || !formData.category || !formData.limit}
                onClick={handleSave}
                className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
