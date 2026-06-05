'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { id } from 'date-fns/locale';
import { getReminders, type Reminder } from '@/infrastructure/storage/LocalStorageReminders';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface DashboardCalendarProps {
  transactions: any[];
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

      // Group reminders by date string
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

  const priorityColors = {
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  return (
    <>
      <div className="w-full flex justify-center text-white text-sm relative">
        <style>{`
          .rdp {
            --rdp-cell-size: 38px;
            --rdp-accent-color: #2dd4bf;
            --rdp-background-color: #262626;
            --rdp-accent-color-dark: #14b8a6;
            --rdp-background-color-dark: #171717;
            --rdp-outline: 2px solid var(--rdp-accent-color);
            --rdp-outline-selected: 3px solid var(--rdp-accent-color);
            margin: 0;
          }
          .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
            color: black;
            background-color: var(--rdp-accent-color);
          }
          .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
            background-color: var(--rdp-background-color);
          }
          .day-with-reminder {
            position: relative;
          }
          .day-with-reminder::after {
            content: '';
            position: absolute;
            top: 3px;
            right: 3px;
            width: 6px;
            height: 6px;
            background-color: #22c55e;
            border-radius: 50%;
            border: 1px solid #0a0a0a;
          }
          .day-with-reminder:hover::after {
            transform: scale(1.3);
            background-color: #4ade80;
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
            hasReminder: 'day-with-reminder cursor-pointer'
          }}
          modifiersStyles={{
            hasTransaction: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: '#2dd4bf',
              textUnderlineOffset: '4px'
            }
          }}
        />
      </div>

      {/* Reminder Detail Modal */}
      <AnimatePresence>
        {showModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#262626] bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="font-bold text-white">Detail Reminder</h3>
                    <p className="text-xs text-zinc-400">
                      {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                {(() => {
                  const dateKey = selectedDate.toISOString().split('T')[0];
                  const dayReminders = remindersByDate[dateKey] || [];
                  return dayReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-4 rounded-xl border ${reminder.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#1A1A1A] border-[#262626]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {reminder.status === 'COMPLETED' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className={`w-4 h-4 ${reminder.priority === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                            )}
                            <h4 className={`font-semibold text-sm ${reminder.status === 'COMPLETED' ? 'text-emerald-400 line-through' : 'text-white'}`}>
                              {reminder.title}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400 ml-6">
                            Rp {(parseFloat(reminder.amount) || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${priorityColors[reminder.priority]} uppercase`}>
                          {reminder.priority === 'HIGH' ? 'Penting' : reminder.priority === 'MEDIUM' ? 'Sedang' : 'Rendah'}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}