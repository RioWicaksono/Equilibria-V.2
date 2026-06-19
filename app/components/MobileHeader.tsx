'use client';

import SearchWrapper from './SearchWrapper';

export default function MobileHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0A0A0A]/98 backdrop-blur-xl border-b border-[#262626] h-14">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-sm">
            E
          </span>
          <span className="text-base font-bold text-white">Equilibria</span>
        </div>
        <SearchWrapper />
      </div>
    </header>
  );
}
