'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { id } from 'date-fns/locale';
import { getReminders, type Reminder } from '@/infrastructure/storage/LocalStorageReminders';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, CheckCircle } from 'lucide-react';
import { Transaction } from '@/domain/entities/Transaction';

interface DashboardCalendarProps {
  transactions?: Transaction[];
}

export default function DashboardCalendar({ transactions }: DashboardCalendarProps) {
  const [reminderDates, setReminderDates] = useState<Date[]>([]);
  const [remindersByDate, setRemindersByDate] = useState<Record<string, Reminder[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const updateReminders = () => {
      const allReminders = getReminders();
      const dates = allReminders.map(r => new Date(r.date.split('T')[0]));
      setReminderDates(dates);

      const grouped: Record<string, Reminder[]> = {};
      allReminders.forEach(r => {
        const dateKey = r.date.split('T')[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(r);
      });
      setRemindersByDate(grouped);
    };
    updateReminders();
    window.addEventListener('reminders-updated', updateReminders);
    return () => window.removeEventListener('reminders-updated', updateReminders);
  }, []);

  const transactionDates = transactions.map(t => new Date(t.date));

  const handleSelectDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayReminders = remindersByDate[dateKey];

    if (dayReminders && dayReminders.length > 0) {
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const priorityConfig = {
    HIGH: {
      bg: 'bg-gradient-to-br from-rose-500/20 to-rose-600/10',
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-400',
      dot: 'bg-rose-500'
    },
    MEDIUM: {
      bg: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
      dot: 'bg-amber-500'
    },
    LOW: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/40',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400',
      dot: 'bg-blue-500'
    }
  };

  const getRemindersForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return remindersByDate[dateKey] || [];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full h-full flex flex-col items-center justify-center text-white relative"
    >
      <style>{`
        .rdp {
          --rdp-cell-size: 36px;
          --rdp-accent-color: #14b8a6;
          --rdp-background-color: rgba(38, 38, 38, 0.8);
          --rdp-outline: 2px solid #14b8a6;
          --rdp-outline-selected: 2px solid #14b8a6;
          margin: 0;
          font-size: 12px;
        }
        @media (min-width: 640px) {
          .rdp {
            --rdp-cell-size: 40px;
            font-size: 13px;
          }
        }
        @media (min-width: 1024px) {
          .rdp {
            --rdp-cell-size: 44px;
            font-size: 14px;
          }
        }
        .rdp-head_cell {
          font-size: 10px;
          font-weight: 600;
          padding: 2px;
          color: #a1a1aa;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        @media (min-width: 640px) {
          .rdp-head_cell {
            font-size: 11px;
          }
        }
        .rdp-day {
          font-weight: 500;
          color: #e4e4e7;
          transition: all 0.2s ease;
        }
        @media (min-width: 640px) {
          .rdp-day {
            font-size: 13px;
          }
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          color: white;
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          font-weight: 700;
          box-shadow: 0 0 20px rgba(20, 184, 166, 0.4);
        }
        .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
          background: rgba(38, 38, 38, 0.9);
          color: white;
        }
        .rdp-day:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #14b8a6, 0 0 0 4px rgba(20, 184, 166, 0.3);
        }
        .rdp-day_today:not(.rdp-day_selected) {
          color: #14b8a6;
          font-weight: 700;
        }
        .day-with-reminder {
          position: relative;
          cursor: pointer;
        }
        .day-with-reminder::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.7; transform: translateX(-50%) scale(1.2); }
        }
        @media (min-width: 1024px) {
          .day-with-reminder::after {
            width: 6px;
            height: 6px;
          }
        }
        .day-with-transaction:not(.day-with-reminder)::before {
          content: '';
          position: absolute;
          top: 4px;
          right: 4px;
          width: 4px;
          height: 4px;
          background: rgba(100, 116, 139, 0.6);
          border-radius: 50%;
        }
        .rdp-nav {
          width: 28px;
          height: 28px;
        }
        @media (min-width: 1024px) {
          .rdp-nav {
            width: 36px;
            height: 36px;
          }
        }
        .rdp-nav button {
          padding: 4px;
          border-radius: 8px;
          transition: all 0.2s ease;
          color: #71717a;
        }
        .rdp-nav button:hover {
          background: rgba(38, 38, 38, 0.9);
          color: #e4e4e7;
        }
        .rdp-caption_label {
          font-size: 14px;
          font-weight: 700;
          color: #fafafa;
          letter-spacing: -0.01em;
        }
        @media (min-width: 1024px) {
          .rdp-caption_label {
            font-size: 16px;
          }
        }
        .rdp-months {
          gap: 0;
        }
        .rdp-month {
          background: transparent;
        }
        .rdp-table {
          background: transparent;
        }
        .rdp-button_previous, .rdp-button_next {
          border-radius: 8px;
        }
      `}</style>

      <DayPicker
        mode="single"
        locale={id}
        selected={selectedDate || undefined}
        required
        onSelect={handleSelectDate}
        modifiers={{
          hasTransaction: transactionDates,
          hasReminder: reminderDates
        }}
        modifiersClassNames={{
          hasReminder: 'day-with-reminder',
          hasTransaction: 'day-with-transaction'
        }}
        modifiersStyles={{
          hasTransaction: {
            color: '#94a3b8'
          }
        }}
        showOutsideDays
      />

      {/* Reminder Modal - Only shows if date has reminders */}
      <AnimatePresence>
        {showModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-5 py-4 border-b border-zinc-800/50">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 flex items-center justify-center border border-teal-500/30">
                      <Bell className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Reminder
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Reminder List */}
              <div className="max-h-80 overflow-y-auto p-3 space-y-2">
                {getRemindersForSelectedDate().map((reminder, index) => {
                  const priority = priorityConfig[reminder.priority] || priorityConfig.MEDIUM;
                  return (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-3 rounded-xl ${priority.bg} border ${priority.border} backdrop-blur-sm`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${priority.badge} flex items-center justify-center shrink-0`}>
                          <Bell className={`w-4 h-4 ${priority.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {reminder.title}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priority.badge}`}>
                              {reminder.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-zinc-500">
                            <span className="text-xs">
                              Rp {Number(reminder.amount).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                        {reminder.status === 'COMPLETED' && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
