'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Menu, X, ChevronLeft, ChevronRight, Lock, Wallet, CreditCard } from 'lucide-react';

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

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleLock = () => {
    sessionStorage.removeItem('equilibria_auth');
    window.location.reload();
  };

  const navItems = [
    { href: '/', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
    { href: '/transactions', icon: <ArrowLeftRight className="h-4 w-4" />, label: 'Transaksi' },
    { href: '/summary', icon: <SummaryIcon />, label: 'Summary' },
    { href: '/statistics', icon: <StatisticsIcon />, label: 'Statistik' },
    { href: '/wallets', icon: <Wallet className="h-4 w-4" />, label: 'Dompet' },
    { href: '/budgets', icon: <CreditCard className="h-4 w-4" />, label: 'Budget' },
    { href: '/goals', icon: <GoalsIcon />, label: 'Target' },
    { href: '/debts', icon: <CreditCard className="h-4 w-4" />, label: 'Hutang' },
    { href: '/recurring', icon: <RecurringIcon />, label: 'Auto' },
    { href: '/reminders', icon: <RemindersIcon />, label: 'Reminder' },
    { href: '/settings', icon: <SettingsIcon />, label: 'Pengaturan' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 bg-[#0A0A0A] border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-md text-xs">
            E
          </span>
          <span className="text-sm font-bold text-white">Equilibria</span>
        </div>
        <button
          onClick={toggleMenu}
          className="text-zinc-400 hover:text-white p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        bg-[#0A0A0A] border-r border-[#262626] flex flex-col
        transform transition-transform duration-300 ease-out
        ${isCollapsed ? 'w-16 md:w-16' : 'w-56 md:w-56'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-12 md:pt-0
      `}>
        {/* Desktop Logo */}
        <div className="hidden md:flex items-center gap-2 px-3 py-3 border-b border-[#262626]">
          <span className="w-7 h-7 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-xs">
            E
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">Equilibria</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Finance App</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`
                  flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
                  ${isActive(item.href)
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Lock Button */}
          <button
            onClick={handleLock}
            title="Kunci Aplikasi"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors w-full mt-3 border border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400"
          >
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span>Kunci</span>
          </button>
        </nav>

        {/* Collapse Button (Desktop only) */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-full text-zinc-400 hover:text-white hover:border-teal-500/50 transition-colors z-10"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </>
  );
}