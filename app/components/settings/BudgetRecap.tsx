'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/contexts/SettingsContext';

interface BudgetRecap {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

interface RecapNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
  read: boolean;
}

export default function BudgetRecap() {
  const { formatCurrency } = useSettings();
  const [recaps, setRecaps] = useState<BudgetRecap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // Default recap schedules
  const defaultRecaps: BudgetRecap[] = [
    { id: '1', type: 'daily', enabled: true, time: '20:00' },
    { id: '2', type: 'weekly', enabled: false, time: '09:00', dayOfWeek: 1 },
    { id: '3', type: 'monthly', enabled: false, time: '09:00', dayOfMonth: 1 },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('equilibria_recap_settings');
    if (saved) {
      setRecaps(JSON.parse(saved));
    } else {
      setRecaps(defaultRecaps);
    }
    setIsLoading(false);
  }, []);

  const saveRecaps = (newRecaps: BudgetRecap[]) => {
    setRecaps(newRecaps);
    localStorage.setItem('equilibria_recap_settings', JSON.stringify(newRecaps));
  };

  const toggleRecap = (id: string) => {
    const updated = recaps.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    saveRecaps(updated);
  };

  const updateTime = (id: string, time: string) => {
    const updated = recaps.map(r =>
      r.id === id ? { ...r, time } : r
    );
    saveRecaps(updated);
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      }
    }
    return false;
  };

  const sendTestNotification = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      alert('Izin notifikasi diperlukan');
      return;
    }

    new Notification('📊 Equilibria - Budget Recap', {
      body: 'Test notifikasi berhasil! Kamu akan menerima ringkasan budget sesuai jadwal.',
      icon: '/icon.svg',
      tag: 'test-recap'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      default: return '🔔';
    }
  };

  const getDayLabel = (recap: BudgetRecap) => {
    if (recap.type === 'daily') return 'Setiap hari';
    if (recap.type === 'weekly') {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return `Setiap ${days[recap.dayOfWeek || 1]}`;
    }
    if (recap.type === 'monthly') {
      return `Setiap tanggal ${recap.dayOfMonth || 1}`;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Budget Recap</h3>
            <p className="text-[10px] text-zinc-500">Ringkasan budget otomatis</p>
          </div>
        </div>
        <button
          onClick={sendTestNotification}
          className="px-3 py-1.5 bg-teal-500/10 text-teal-400 text-xs font-medium rounded-lg hover:bg-teal-500/20 transition-colors"
        >
          Test
        </button>
      </div>

      {/* Permission Status */}
      {!('Notification' in window) || Notification.permission === 'denied' ? (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-rose-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Notifikasi diblokir. Aktifkan di pengaturan browser.</span>
          </div>
        </div>
      ) : Notification.permission === 'default' ? (
        <button
          onClick={requestPermission}
          className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
        >
          Aktifkan Notifikasi
        </button>
      ) : null}

      {/* Recap List */}
      <div className="space-y-2">
        {recaps.map(recap => (
          <div
            key={recap.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              recap.enabled ? 'bg-[#141414]' : 'bg-[#1A1A1A]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getTypeIcon(recap.type)}</span>
              <div>
                <p className={`text-sm font-medium ${recap.enabled ? 'text-white' : 'text-zinc-500'}`}>
                  {getTypeLabel(recap.type)}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {getDayLabel(recap)} • {recap.time}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleRecap(recap.id)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                recap.enabled ? 'bg-teal-500' : 'bg-zinc-700'
              }`}
            >
              <motion.div
                animate={{ x: recap.enabled ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-3 bg-zinc-800/30 rounded-lg">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500 mt-0.5" />
          <div className="text-[10px] text-zinc-500 space-y-1">
            <p>📊 <strong className="text-zinc-400">Ringkasan Harian:</strong> Total pengeluaran & budget tersisa</p>
            <p>📈 <strong className="text-zinc-400">Ringkasan Mingguan:</strong> Perbandingan dengan minggu lalu</p>
            <p>💰 <strong className="text-zinc-400">Ringkasan Bulanan:</strong> Analisis lengkap bulan ini</p>
          </div>
        </div>
      </div>
    </div>
  );
}
