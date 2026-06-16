import { Bell } from 'lucide-react';
import ClientReminderList from './ClientReminderList';

export const dynamic = 'force-dynamic';

export default function RemindersPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-2xl font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
            Reminders
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Kelola daftar pengingat dan tagihan dengan fitur lengkap.</p>
        </div>
      </header>

      <ClientReminderList />
    </div>
  );
}
