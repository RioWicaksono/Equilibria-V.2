import { Bell } from 'lucide-react';
import ClientReminderList from './ClientReminderList';

export const dynamic = 'force-dynamic';

export default function RemindersPage() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 sm:w-5 sm:h-5 text-teal-400" />
            Reminders
          </h2>
          <p className="text-xs text-zinc-500">Kelola daftar pengingat dan tagihan.</p>
        </div>
      </header>

      <ClientReminderList />
    </div>
  );
}
