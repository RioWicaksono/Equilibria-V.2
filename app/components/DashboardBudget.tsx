'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, X, Bell } from 'lucide-react';
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

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg p-1.5 h-full" role="region" aria-label="Pelacakan Anggaran Bulanan">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Target className="w-2.5 h-2.5 text-indigo-400" />
          <h3 className="text-[9px] font-bold text-white">Anggaran</h3>
          {budgets.some(b => {
            const spent = categoryTotals[b.category] || 0;
            return (spent / b.limit) * 100 >= alertThreshold;
          }) && (
            <Bell className="w-2 h-2 text-amber-400 animate-pulse" />
          )}
        </div>
        {!isAdding && (
          <button
            aria-label="Tambah"
            onClick={() => setIsAdding(true)}
            className="p-0.5 text-zinc-500 hover:text-indigo-400 rounded"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      <div className="space-y-0.5 max-h-[90px] overflow-y-auto">
        {budgets.length === 0 && !isAdding && (
          <div className="text-center text-[8px] text-zinc-500 py-1">Belum ada anggaran.</div>
        )}

        {budgets.map((budget) => {
          const spent = categoryTotals[budget.category] || 0;
          const progress = Math.min((spent / budget.limit) * 100, 100);
          const isNearLimit = progress >= alertThreshold;
          const isOverLimit = progress >= 100;

          return (
            <div key={budget.id} className="flex items-center gap-1 p-0.5 rounded bg-[#1A1A1A]">
              <span className="text-[8px] text-zinc-300 truncate flex-1 w-12">{budget.category}</span>
              <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[7px] text-zinc-500">{Math.round(progress)}%</span>
            </div>
          );
        })}

        {isAdding && (
          <div className="p-1.5 rounded border border-indigo-500/30 bg-indigo-500/5 space-y-1">
            <div className="flex gap-1">
              <input
                type="text" placeholder="Kategori"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                className="flex-1 bg-[#1A1A1A] border border-[#262626] text-white rounded text-[8px] p-1 focus:border-indigo-500 outline-none"
              />
              <input
                type="text" placeholder="Limit"
                value={formData.limit} onChange={e => setFormData({...formData, limit: e.target.value.replace(/\D/g, '')})}
                className="w-16 bg-[#1A1A1A] border border-[#262626] text-white rounded text-[8px] p-1 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-0.5 text-[8px] text-zinc-400 rounded bg-zinc-800">Batal</button>
              <button
                disabled={isSubmitting || !formData.category || !formData.limit}
                onClick={handleSave}
                className="flex-1 py-0.5 text-[8px] font-bold text-white bg-indigo-500 rounded disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
