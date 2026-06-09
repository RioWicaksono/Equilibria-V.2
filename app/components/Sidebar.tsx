'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Menu, X, ChevronLeft, ChevronRight, Lock, FileText, BarChart3, Wallet, Target, CreditCard, RefreshCw, Bell, Settings } from 'lucide-react';

// Inline SVG components for icons
const SummaryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const StatisticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const GoalsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

const RecurringIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
  </svg>
);

const RemindersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
}

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

  const handleLock = () => {
    sessionStorage.removeItem('equilibria_auth');
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[#0D0D0D] border-b border-[#262626]">
        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-7 h-7 flex items-center justify-center font-black bg-[#0A0A0A] text-[#faff04] border-2 border-[#faff04] rounded-full">
            E
          </span>
          Equilibria
        </h1>
        <button onClick={toggleMenu} className="text-zinc-400 hover:text-white p-1.5">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
        bg-[#0D0D0D] border-r border-[#262626] flex flex-col p-2.5 md:p-4 flex-shrink-0 md:min-h-screen
        transform transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16 md:w-20' : 'w-52 md:w-60'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`mb-4 md:mb-6 hidden md:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-black bg-[#000000] text-[#faff04] border border-[#faff04] rounded-[16px] md:rounded-[20px] flex-shrink-0">
              E
            </span>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                  Equilibria
                </h1>
                <p className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest">
                  Rio's Finance
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              title="Collapse"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="mb-4 hidden md:flex justify-center">
            <button
              onClick={toggleCollapse}
              className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-800 transition-colors"
              title="Expand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto custom-scrollbar pb-16 md:pb-20">
          <div className={`px-2 py-1.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-wider mt-2 whitespace-nowrap ${isCollapsed ? 'text-center px-0' : ''}`}>
            {isCollapsed ? '---' : 'Menu'}
          </div>

          {/* Nav Items - Compact */}
          {[
            { href: '/', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
            { href: '/transactions', icon: <ArrowLeftRight className="h-4 w-4" />, label: 'Transaksi' },
            { href: '/summary', icon: <SummaryIcon />, label: 'Summary' },
            { href: '/statistics', icon: <StatisticsIcon />, label: 'Statistik' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
                pathname === item.href ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}

          <div className={`px-2 py-1.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-wider mt-3 whitespace-nowrap ${isCollapsed ? 'text-center px-0' : ''}`}>
            {isCollapsed ? '---' : 'Fitur'}
          </div>

          {[
            { href: '/wallets', icon: <Wallet className="h-4 w-4" />, label: 'Dompet' },
            { href: '/budgets', icon: <CreditCard className="h-4 w-4" />, label: 'Budget' },
            { href: '/goals', icon: <GoalsIcon />, label: 'Target' },
            { href: '/debts', icon: <CreditCard className="h-4 w-4" />, label: 'Hutang' },
            { href: '/recurring', icon: <RecurringIcon />, label: 'Auto' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
                pathname === item.href ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}

          <div className={`px-2 py-1.5 text-[9px] font-semibold text-zinc-600 uppercase tracking-wider mt-3 whitespace-nowrap ${isCollapsed ? 'text-center px-0' : ''}`}>
            {isCollapsed ? '---' : 'Lain'}
          </div>

          {[
            { href: '/reminders', icon: <RemindersIcon />, label: 'Reminder' },
            { href: '/settings', icon: <SettingsIcon />, label: 'Pengaturan' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
                pathname === item.href ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}

          {/* Lock Button */}
          <button
            onClick={handleLock}
            title="Kunci Aplikasi"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors w-full mt-3 border border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Lock className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Kunci</span>}
          </button>
        </nav>
      </aside>
    </>
  );
}