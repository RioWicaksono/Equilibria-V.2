'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { id } from 'date-fns/locale';
import { getReminders } from '@/infrastructure/storage/LocalStorageReminders';

interface DashboardCalendarProps {
  transactions: any[];
}

export default function DashboardCalendar({ transactions }: DashboardCalendarProps) {
  const [reminderDates, setReminderDates] = useState<Date[]>([]);

  useEffect(() => {
    const updateReminders = () => {
      const dates = getReminders().map(r => new Date(r.date.split('T')[0]));
      setReminderDates(dates);
    };
    updateReminders();
    window.addEventListener('reminders-updated', updateReminders);
    return () => window.removeEventListener('reminders-updated', updateReminders);
  }, []);

  const transactionDates = transactions.map(t => new Date(t.date));

  return (
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
          width: 5px;
          height: 5px;
          background-color: #f43f5e;
          border-radius: 50%;
        }
      `}</style>
      <DayPicker
        mode="single"
        locale={id}
        modifiers={{
          hasTransaction: transactionDates,
          hasReminder: reminderDates
        }}
        modifiersClassNames={{
          hasReminder: 'day-with-reminder'
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
  );
}