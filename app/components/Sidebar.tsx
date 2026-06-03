'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  systemStatus: {
    isRailway: boolean;
  };
}

export default function Sidebar({ systemStatus }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

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
        bg-[#0D0D0D] border-r border-[#262626] flex flex-col p-4 flex-shrink-0 md:min-h-screen
        transform transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`mb-10 hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center font-black bg-[#000000] text-[#faff04] border border-[#faff04] rounded-[20px] flex-shrink-0">
              E
            </span> 
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Equilibria
                </h1>
                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest">
                  Rio&apos;s Finance Tracker
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={toggleCollapse} 
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {isCollapsed && (
          <div className="mb-6 hidden md:flex justify-center">
            <button 
              onClick={toggleCollapse} 
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
        
        <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-20">
          <div className={`px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider mt-4 whitespace-nowrap ${isCollapsed ? 'text-center text-[10px] px-0' : ''}`}>
            {isCollapsed ? '---' : 'Main Menu'}
          </div>
          <Link 
            href="/" 
            onClick={closeMenu}
            title="Dashboard"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link 
            href="/transactions" 
            onClick={closeMenu}
            title="Transaksi"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/transactions' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <ArrowLeftRight className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Transaksi</span>}
          </Link>
          <Link 
            href="/summary" 
            onClick={closeMenu}
            title="Summary Report"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/summary' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            {!isCollapsed && <span>Summary Report</span>}
          </Link>

          <div className={`px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider mt-6 whitespace-nowrap ${isCollapsed ? 'text-center text-[10px] px-0' : ''}`}>
            {isCollapsed ? '---' : 'Fitur Cerdas'}
          </div>
          <Link 
            href="/wallets" 
            onClick={closeMenu}
            title="Multi-Dompet"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/wallets' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            {!isCollapsed && <span>Multi-Dompet</span>}
          </Link>
          <Link 
            href="/goals" 
            onClick={closeMenu}
            title="Target Tabungan"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/goals' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            {!isCollapsed && <span>Target Tabungan</span>}
          </Link>
          <Link 
            href="/debts" 
            onClick={closeMenu}
            title="Catatan Hutang"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/debts' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
            {!isCollapsed && <span>Catatan Hutang</span>}
          </Link>
          <Link 
            href="/recurring" 
            onClick={closeMenu}
            title="Transaksi Otomatis"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/recurring' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            {!isCollapsed && <span>Transaksi Otomatis</span>}
          </Link>

          <div className={`px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider mt-6 whitespace-nowrap ${isCollapsed ? 'text-center text-[10px] px-0' : ''}`}>
            {isCollapsed ? '---' : 'Lainnya'}
          </div>
          <Link 
            href="/reminders" 
            onClick={closeMenu}
            title="Reminder"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/reminders' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {!isCollapsed && <span>Reminder</span>}
          </Link>
          <Link 
            href="/settings" 
            onClick={closeMenu}
            title="Pengaturan"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
              pathname === '/settings' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            {!isCollapsed && <span>Pengaturan</span>}
          </Link>
        </nav>
      </aside>
    </>
  );
}
