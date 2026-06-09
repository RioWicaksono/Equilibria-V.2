'use client';

import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LockButton() {
  const router = useRouter();

  const handleLock = () => {
    sessionStorage.removeItem('equilibria_auth');
    router.refresh();
  };

  return (
    <button
      onClick={handleLock}
      title="Kunci Aplikasi"
      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 rounded text-rose-400 transition-all duration-200 group"
    >
      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
      <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Kunci</span>
    </button>
  );
}