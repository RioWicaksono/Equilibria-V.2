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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full flex justify-center text-white relative overflow-auto max-h-full"
    >
        <style>{`
          .rdp {
            --rdp-cell-size: 28px;
            --rdp-accent-color: #14b8a6;
            --rdp-background-color: #27272a;
            margin: 0;
            font-size: 11px;
          }
          @media (min-width: 1024px) {
            .rdp {
              --rdp-cell-size: 36px;
              font-size: 13px;
            }
          }
          @media (min-width: 1280px) {
            .rdp {
              --rdp-cell-size: 40px;
              font-size: 14px;
            }
          }
          .rdp-head_cell {
            font-size: 9px;
            padding: 1px;
            color: #71717a;
          }
          @media (min-width: 1024px) {
            .rdp-head_cell {
              font-size: 11px;
              padding: 2px;
            }
          }
          .rdp-day {
            font-size: 11px;
            padding: 1px;
            color: #e4e4e7;
          }
          @media (min-width: 1024px) {
            .rdp-day {
              font-size: 13px;
              padding: 2px;
            }
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
            top: 2px;
            right: 2px;
            width: 4px;
            height: 4px;
            background-color: #22c55e;
            border-radius: 50%;
          }
          @media (min-width: 1024px) {
            .day-with-reminder::after {
              width: 5px;
              height: 5px;
            }
          }
          .rdp-nav {
            width: 24px;
            height: 24px;
          }
          @media (min-width: 1024px) {
            .rdp-nav {
              width: 32px;
              height: 32px;
            }
          }
          .rdp-nav button {
            padding: 0;
          }
          .rdp-caption_label {
            font-size: 12px;
            font-weight: 600;
            color: #fafafa;
          }
          @media (min-width: 1024px) {
            .rdp-caption_label {
              font-size: 14px;
            }
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
      </motion.div>
    </motion.div>
  );
}
