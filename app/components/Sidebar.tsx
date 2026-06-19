'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, Target, Repeat, Bell, BarChart3, Settings, Upload, Share2, DollarSign, ChevronLeft, ChevronRight, TrendingUp, PiggyBank } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navCategories: NavCategory[] = [
    {
      title: 'Utama',
      items: [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
      ],
    },
    {
      title: 'Ringkasan',
      items: [
        { href: '/summary', icon: PiggyBank, label: 'Summary' },
        { href: '/statistics', icon: BarChart3, label: 'Statistik' },
        { href: '/networth', icon: TrendingUp, label: 'Net Worth' },
      ],
    },
    {
      title: 'Kelola',
      items: [
        { href: '/wallets', icon: Wallet, label: 'Dompet' },
        { href: '/budgets', icon: CreditCard, label: 'Budget' },
        { href: '/goals', icon: Target, label: 'Target' },
        { href: '/debts', icon: DollarSign, label: 'Hutang' },
        { href: '/recurring', icon: Repeat, label: 'Auto' },
      ],
    },
    {
      title: 'Lainnya',
      items: [
        { href: '/reminders', icon: Bell, label: 'Reminder' },
        { href: '/import', icon: Upload, label: 'Import' },
        { href: '/share', icon: Share2, label: 'Export' },
        { href: '/settings', icon: Settings, label: 'Pengaturan' },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={`
      fixed lg:relative inset-y-0 z-40
      bg-[#0A0A0A] border-r border-[#262626] flex flex-col
      transform transition-all duration-300 ease-out
      ${isCollapsed ? 'w-14' : 'w-52'}
      -translate-x-full lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#262626]">
        <span className="w-7 h-7 flex items-center justify-center font-black bg-black text-[#faff04] border border-[#faff04] rounded-lg text-xs flex-shrink-0">
          E
        </span>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">Equilibria</span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Finance</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2">
        {isCollapsed ? (
          // Compact mode - just icons
          <div className="space-y-0.5">
            {navCategories.flatMap(cat => cat.items).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-teal-500/15 text-teal-400'
                    : 'text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300'}
                `}
                title={item.label}
              >
                <item.icon className="w-4 h-4" />
              </Link>
            ))}
          </div>
        ) : (
          // Expanded mode - grouped by category
          <div className="space-y-3">
            {navCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-1">
                  {category.title}
                </h3>
                <div className="space-y-0.5">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                        ${isActive(item.href)
                          ? 'bg-teal-500/15 text-teal-400'
                          : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'}
                      `}
                    >
                      <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive(item.href) ? 'text-teal-400' : ''}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-16 w-5 h-5 items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-full text-zinc-400 hover:text-white hover:border-teal-500/50 transition-all duration-200 hidden lg:flex shadow-lg"
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-2.5 h-2.5" />
        ) : (
          <ChevronLeft className="w-2.5 h-2.5" />
        )}
      </button>

      {/* Version */}
      <div className="hidden lg:block px-3 py-2 border-t border-[#262626]">
        <p className="text-[9px] text-zinc-600 text-center">
          {isCollapsed ? 'v2' : 'Equilibria v2.0'}
        </p>
      </div>
    </aside>
  );
}
