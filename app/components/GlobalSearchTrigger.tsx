'use client';

import GlobalSearch from './GlobalSearch';
import { useState } from 'react';

export default function GlobalSearchTrigger() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#262626] rounded-xl text-sm text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
        title="Cari (Ctrl+K)"
        aria-label="Buka pencarian"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Cari...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 text-zinc-600 text-xs rounded border border-zinc-700">
          ⌘K
        </kbd>
      </button>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
