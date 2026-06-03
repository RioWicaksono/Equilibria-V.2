'use client';

import { Bell, ArrowRight } from 'lucide-react';
import { Reminder, getReminders } from '@/lib/reminders';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardReminder() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      setReminders(getReminders());
    }
    handleUpdate();
    window.addEventListener('reminders-updated', handleUpdate);
    return () => {
      window.removeEventListener('reminders-updated', handleUpdate);
    };
  }, []);

  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return `Tgl ${d.getDate()}`;
    } catch {
      return isoDate;
    }
  };

  const pendingReminders = reminders.filter(r => r.status === 'PENDING').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 h-full flex flex-col hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Pengingat Tagihan</h3>
        </div>
        <Link href="/reminders" className="text-zinc-500 hover:text-indigo-400 text-sm transition-colors flex items-center gap-1 group">
          Lihat Semua
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="space-y-3 flex-1">
        {pendingReminders.length > 0 ? pendingReminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-[#1A1A1A]"
          >
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                {reminder.title}
                {reminder.priority === 'HIGH' && (
                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Penting</span>
                )}
              </span>
              <span className="text-xs text-zinc-500">Jatuh tempo: {formatDateLabel(reminder.date)}</span>
            </div>
            {reminder.amount && (
              <span className="text-sm font-medium text-zinc-300">
                {reminder.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </span>
            )}
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="text-zinc-500 text-sm">Tidak ada tagihan tertunda</span>
          </div>
        )}
      </div>
      
      <Link href="/reminders" className="w-full mt-6 py-2.5 bg-zinc-800/80 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2">
        Kelola Pengingat
      </Link>
    </div>
  );
}
