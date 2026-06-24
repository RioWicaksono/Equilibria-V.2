'use client';

import SearchWrapper from './SearchWrapper';

export default function MobileHeader() {
  return (
    <header className="h-full flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04]/50 rounded-lg text-xs shadow-md shrink-0">
          E
        </span>
        <div>
          <span className="text-sm font-bold text-white">Equilibria</span>
          <span className="text-[10px] text-zinc-500 block">Finance</span>
        </div>
      </div>
      <SearchWrapper />
    </header>
  );
}
