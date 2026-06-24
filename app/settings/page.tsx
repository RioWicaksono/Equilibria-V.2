import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-8rem)]">
      <header className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white">Pengaturan</h2>
          <p className="text-xs text-zinc-500 mt-1">Keamanan dan preferensi aplikasi.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <SettingsClient />
      </div>
    </div>
  );
}
