'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Menu, X } from 'lucide-react';

interface SidebarProps {
  systemStatus: {
    isRailway: boolean;
  };
}

export default function Sidebar({ systemStatus }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0D0D0D] border-b border-[#262626]">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center font-black bg-[#000000] text-[#faff04] border border-[#faff04] rounded-[20px]">
            E
          </span> 
          Equilibria
        </h1>
        <button onClick={toggleMenu} className="text-zinc-400 hover:text-white p-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#0D0D0D] border-r border-[#262626] flex flex-col p-6 flex-shrink-0 md:min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-10 hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center font-black bg-[#000000] text-[#faff04] border border-[#faff04] rounded-[20px]">
              E
            </span> 
            Equilibria
          </h1>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">
            Rio's Finance Tracker
          </p>
        </div>
        
        <nav className="flex-1 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Main Menu
          </div>
          <Link 
            href="/" 
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/transactions" 
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/transactions' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span>Transaksi</span>
          </Link>
          <Link 
            href="/summary" 
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/summary' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Summary Report</span>
          </Link>
          <Link 
            href="/settings" 
            onClick={closeMenu}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/settings' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Pengaturan</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
