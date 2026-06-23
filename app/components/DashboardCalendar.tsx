'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { id } from 'date-fns/locale';
import { getReminders, type Reminder } from '@/infrastructure/storage/LocalStorageReminders';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Transaction } from '@/domain/entities/Transaction';

interface DashboardCalendarProps {
  transactions: Transaction[];
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

  const priorityColors = {
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  return (
    <>
      <div className="w-full flex justify-center text-white relative overflow-auto max-h-full">
        <style>{`
          .rdp {
            --rdp-cell-size: 24px;
            --rdp-accent-color: #14b8a6;
            --rdp-background-color: #27272a;
            margin: 0;
            font-size: 10px;
          }
          .rdp-head_cell {
            font-size: 8px;
            padding: 1px;
            color: #71717a;
          }
          .rdp-day {
            font-size: 10px;
            padding: 1px;
            color: #e4e4e7;
          }
          .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
            color: white;
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
            top: 1px;
            right: 1px;
            width: 3px;
            height: 3px;
            background-color: #22c55e;
            border-radius: 50%;
          }
          .rdp-nav {
            width: 20px;
            height: 20px;
          }
          .rdp-nav button {
            padding: 0;
          }
          .rdp-caption_label {
            font-size: 11px;
            font-weight: 600;
            color: #fafafa;
          }
          .rdp-months {
            gap: 0;
          }
          .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
            background-color: #27272a;
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
              textDecorationColor: '#2dd4bf'
            }
          }}
          showOutsideDays
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
              <div className="flex items-center justify-between p-3 border-b border-[#262626] bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-white">
                    {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                {(() => {
                  const dateKey = selectedDate.toISOString().split('T')[0];
                  const dayReminders = remindersByDate[dateKey] || [];
                  return dayReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-2 rounded border ${reminder.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#1A1A1A] border-[#262626]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {reminder.status === 'COMPLETED' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className={`w-3 h-3 ${reminder.priority === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                          )}
                          <span className={`text-xs ${reminder.status === 'COMPLETED' ? 'text-emerald-400 line-through' : 'text-white'}`}>
                            {reminder.title}
                          </span>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[reminder.priority]}`}>
                          {reminder.priority}
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
