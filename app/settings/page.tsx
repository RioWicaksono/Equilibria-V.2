import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full max-h-screen">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Pengaturan</h2>
          <p className="text-sm text-zinc-500 mt-1">Kelola keamanan dan preferensi aplikasi Anda.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Keamanan</h3>
            <SettingsClient />
          </div>
        </div>
      </div>
    </div>
  );
}
