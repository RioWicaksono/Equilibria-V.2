'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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
      bg-[#09090b] border-r border-zinc-800/50 flex flex-col
      transform transition-all duration-300 ease-out
      ${isCollapsed ? 'w-16' : 'w-56'}
      -translate-x-full lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800/50">
        <div className="w-9 h-9 flex items-center justify-center font-bold bg-teal-500 text-white rounded-lg shadow-lg shadow-teal-500/20 flex-shrink-0">
          E
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white">Equilibria</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Finance App</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-4">
        {isCollapsed ? (
          <div className="space-y-1">
            {navCategories.flatMap(cat => cat.items).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {navCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-2">
                  {category.title}
                </h3>
                <div className="space-y-0.5">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive(item.href)
                          ? 'bg-teal-500/10 text-teal-400'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      )}
                    >
                      <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive(item.href) ? 'text-teal-400' : 'text-zinc-500')} />
                      <span className="truncate">{item.label}</span>
                      {isActive(item.href) && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
                      )}
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
        className="absolute -right-3 top-20 w-6 h-6 items-center justify-center bg-[#18181b] border border-zinc-800 rounded-full text-zinc-500 hover:text-white hover:border-teal-500/50 transition-all duration-200 hidden lg:flex shadow-lg"
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Version */}
      <div className="hidden lg:block px-4 py-3 border-t border-zinc-800/50">
        <p className="text-[10px] text-zinc-600 text-center">
          {isCollapsed ? 'v2.0' : 'Equilibria v2.0'}
        </p>
      </div>
    </aside>
  );
}
