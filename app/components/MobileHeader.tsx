'use client';

import SearchWrapper from './SearchWrapper';

export default function MobileHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#09090b]/98 backdrop-blur-xl border-b border-zinc-800/50 h-14">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center font-bold bg-teal-500 text-white rounded-lg shadow-lg shadow-teal-500/20 text-sm">
            E
          </div>
          <div>
            <span className="text-sm font-bold text-white">Equilibria</span>
            <span className="text-[10px] text-zinc-500 block">Finance</span>
          </div>
        </div>
        <SearchWrapper />
      </div>
    </header>
  );
}
