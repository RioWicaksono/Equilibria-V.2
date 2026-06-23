'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
      className="card p-2 sm:p-3 xl:p-4 h-full flex flex-col overflow-hidden"
      role="region"
      aria-label="Pelacakan Anggaran Bulanan"
    >
      <div className="flex items-center justify-between mb-2 lg:mb-3 shrink-0">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs lg:text-sm font-semibold text-white">Anggaran Bulanan</h3>
            {hasAlert && (
              <p className="text-[9px] lg:text-[10px] text-amber-400 flex items-center gap-0.5 lg:gap-1">
                <Bell className="w-2.5 h-2.5 lg:w-3 lg:h-3" /> Hampir penuh
              </p>
            )}
          </div>
        </div>
        {!isAdding && (
          <button
            aria-label="Tambah Budget"
            onClick={() => setIsAdding(true)}
            className="p-1.5 lg:p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2 lg:space-y-3 flex-1 overflow-y-auto">
        {budgets.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-4 lg:py-6 text-center">
            <Target className="w-8 h-8 lg:w-10 lg:h-10 text-zinc-700 mb-2 lg:mb-3" />
            <p className="text-xs lg:text-sm text-zinc-400">Belum ada anggaran</p>
            <p className="text-[10px] lg:text-xs text-zinc-600">Klik + untuk menambahkan</p>
          </div>
        )}

        {budgets.map((budget, index) => {
          const spent = categoryTotals[budget.category] || 0;
          const progress = Math.min((spent / budget.limit) * 100, 100);
          const isNearLimit = progress >= alertThreshold;
          const isOverLimit = progress >= 100;

          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
              className="p-2 lg:p-3 rounded-lg bg-[#1f1f23] border border-zinc-800/50 hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs lg:text-sm font-medium text-white truncate">{budget.category}</span>
                <span className={`text-xs lg:text-sm font-bold ${isOverLimit ? 'text-rose-400' : isNearLimit ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 lg:h-2 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] lg:text-xs text-zinc-500">
                <span>Rp {formatCurrency(spent)}</span>
                <span>Limit: Rp {formatCurrency(budget.limit)}</span>
              </div>
            </motion.div>
          );
        })}

        {isAdding && (
          <motion.div className="p-3 lg:p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-3">
            <div className="flex gap-2 lg:gap-3">
              <input
                type="text"
                placeholder="Nama kategori"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="flex-1 bg-[#1f1f23] border border-zinc-800 text-white rounded-lg text-xs lg:text-sm p-2 lg:p-3 focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                placeholder="Limit"
                value={formData.limit}
                onChange={e => setFormData({...formData, limit: e.target.value.replace(/\D/g, '')})}
                className="w-28 lg:w-32 bg-[#1f1f23] border border-zinc-800 text-white rounded-lg text-xs lg:text-sm p-2 lg:p-3 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-2 lg:gap-3">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 lg:py-2.5 text-xs lg:text-sm text-zinc-400 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Batal
              </button>
              <button
                disabled={isSubmitting || !formData.category || !formData.limit}
                onClick={handleSave}
                className="flex-1 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
