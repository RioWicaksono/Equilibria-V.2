'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Repeat, CreditCard, Home, Tv, Wifi, Phone, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '@/contexts/SettingsContext';

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDate: string;
  category?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  recurringItems: RecurringItem[];
}

const categoryIcons: Record<string, string> = {
  'Streaming': '📺',
  'Sewa': '🏠',
  'Internet': '📡',
  'Telepon': '📱',
  'Belanja': '🛒',
  'default': '💳'
};

const categoryColors: Record<string, string> = {
  'Streaming': 'bg-rose-500/10 text-rose-400',
  'Sewa': 'bg-amber-500/10 text-amber-400',
  'Internet': 'bg-blue-500/10 text-blue-400',
  'Telepon': 'bg-green-500/10 text-green-400',
  'Belanja': 'bg-purple-500/10 text-purple-400',
  'default': 'bg-zinc-500/10 text-zinc-400'
};

export default function RecurringCalendar({
  recurringItems,
  onItemClick
}: {
  recurringItems: RecurringItem[];
  onItemClick?: (item: RecurringItem) => void;
}) {
  const { formatCurrency } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
        recurringItems: []
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = date.toDateString() === today.toDateString();

      // Find recurring items for this date
      const dayRecurring = recurringItems.filter(item => {
        const nextDate = new Date(item.nextDate);
        const itemDate = new Date(nextDate);

        // Check if this date matches the recurring pattern
        switch (item.frequency) {
          case 'daily':
            return true;
          case 'weekly':
            return date.getDay() === itemDate.getDay();
          case 'biweekly':
            const weeksDiff = Math.floor((date.getTime() - itemDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            return weeksDiff % 2 === 0 && date.getDay() === itemDate.getDay();
          case 'monthly':
            return date.getDate() === itemDate.getDate() ||
                   (date.getDate() > itemDate.getDate() && itemDate.getDate() === lastDay.getDate());
          default:
            return date.toDateString() === itemDate.toDateString();
        }
      });

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        recurringItems: dayRecurring
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
        recurringItems: []
      });
    }

    return days;
  };

  const calendarDays = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getSelectedDateItems = () => {
    if (!selectedDate) return [];
    return calendarDays.find(
      d => d.date.toDateString() === selectedDate.toDateString()
    )?.recurringItems || [];
  };

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    return recurringItems.reduce((sum, item) => {
      if (item.frequency === 'monthly') return sum + item.amount;
      if (item.frequency === 'weekly') return sum + (item.amount * 4);
      if (item.frequency === 'daily') return sum + (item.amount * 30);
      return sum + item.amount;
    }, 0);
  }, [recurringItems]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Calendar className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Kalender Auto Transaksi</h3>
            <p className="text-[10px] text-zinc-500">Pantau jadwal transaksi otomatis</p>
          </div>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 bg-teal-500/10 text-teal-400 text-xs font-medium rounded-lg hover:bg-teal-500/20 transition-colors"
        >
          Hari Ini
        </button>
      </div>

      {/* Monthly Total */}
      <div className="p-3 bg-gradient-to-r from-rose-500/10 to-rose-500/5 border border-rose-500/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-rose-400 font-medium">Total Bulanan</span>
          </div>
          <span className="text-lg font-bold text-rose-400">
            {formatCurrency(monthlyTotal)}
          </span>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="text-sm font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <button
          onClick={nextMonth}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-3">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-zinc-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const hasItems = day.recurringItems.length > 0;
            const isSelected = selectedDate?.toDateString() === day.date.toDateString();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs
                  transition-all duration-200
                  ${!day.isCurrentMonth ? 'text-zinc-600' : 'text-zinc-300'}
                  ${day.isToday ? 'bg-teal-500/20 text-teal-400 font-bold' : ''}
                  ${isSelected ? 'bg-teal-500 text-black font-bold' : 'hover:bg-zinc-800'}
                `}
              >
                <span>{day.date.getDate()}</span>
                {hasItems && (
                  <div className={`absolute bottom-1 flex gap-0.5 ${
                    isSelected ? '' : day.isCurrentMonth ? '' : 'opacity-30'
                  }`}>
                    {day.recurringItems.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.amount > 1000000 ? 'bg-rose-400' :
                          item.amount > 500000 ? 'bg-amber-400' :
                          'bg-teal-400'
                        }`}
                      />
                    ))}
                    {day.recurringItems.length > 3 && (
                      <span className="text-[8px] text-zinc-500">+</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A1A] rounded-xl p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {selectedDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
            <span className="text-xs text-zinc-500">
              {getSelectedDateItems().length} transaksi
            </span>
          </div>

          {getSelectedDateItems().length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">
              Tidak ada transaksi otomatis di tanggal ini
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {getSelectedDateItems().map(item => (
                <button
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className="w-full flex items-center justify-between p-2 bg-[#141414] rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {categoryIcons[item.category || 'default']}
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-medium text-white">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">{item.frequency}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-rose-400">
                    -{formatCurrency(item.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
