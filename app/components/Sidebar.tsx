'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, ChevronLeft, ChevronRight, Wallet, CreditCard, Target, RefreshCw, Bell, BarChart3, LayoutGrid, Settings, Upload, Share2 } from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
    { href: '/summary', icon: LayoutGrid, label: 'Summary' },
    { href: '/statistics', icon: BarChart3, label: 'Statistik' },
    { href: '/wallets', icon: Wallet, label: 'Dompet' },
    { href: '/budgets', icon: CreditCard, label: 'Budget' },
    { href: '/goals', icon: Target, label: 'Target' },
    { href: '/debts', icon: RefreshCw, label: 'Hutang' },
    { href: '/recurring', icon: RefreshCw, label: 'Auto' },
    { href: '/reminders', icon: Bell, label: 'Reminder' },
    { href: '/import', icon: Upload, label: 'Import' },
    { href: '/share', icon: Share2, label: 'Export' },
    { href: '/settings', icon: Settings, label: 'Pengaturan' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={`
      fixed lg:relative inset-y-0 z-40
      bg-[#0A0A0A] border-r border-[#262626] flex flex-col
      transform transition-all duration-300 ease-out
      ${isCollapsed ? 'w-16' : 'w-64'}
      -translate-x-full lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[#262626]">
        <span className="w-8 h-8 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-sm flex-shrink-0">
          E
        </span>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">Equilibria</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Finance App</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-3">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive(item.href)
                  ? 'bg-teal-500/15 text-teal-400 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? 'text-teal-400' : ''}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Collapse Button - Show on lg+ */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-full text-zinc-400 hover:text-white hover:border-teal-500/50 transition-all duration-200 hidden lg:flex shadow-lg"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Version - Show on lg+ */}
      {(isCollapsed || !isCollapsed) && (
        <div className="hidden lg:block px-4 py-3 border-t border-[#262626]">
          <p className="text-[10px] text-zinc-600 text-center">
            {isCollapsed ? 'v2.0' : 'Equilibria v2.0'}
          </p>
        </div>
      )}
    </aside>
  );
}