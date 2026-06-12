'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Receipt, Wallet, Target, Settings, MoreHorizontal, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/transactions', icon: Receipt, label: 'Transaksi' },
  { href: '/wallets', icon: Wallet, label: 'Dompet' },
  { href: '/goals', icon: Target, label: 'Target' },
  { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

const moreMenuItems = [
  { href: '/budgets', label: 'Budget', emoji: '💰' },
  { href: '/debts', label: 'Hutang', emoji: '📋' },
  { href: '/recurring', label: 'Auto', emoji: '🔄' },
  { href: '/reminders', label: 'Reminder', emoji: '⏰' },
  { href: '/summary', label: 'Summary', emoji: '📊' },
  { href: '/statistics', label: 'Statistik', emoji: '📈' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#262626]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-14
                ${isActive(item.href)
                  ? 'text-teal-400'
                  : 'text-zinc-500 hover:text-zinc-300'}
              `}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open more menu"
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-14
              ${isMenuOpen ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-medium">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* Overlay Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="absolute bottom-20 left-0 right-0 bg-[#141414] border-t border-[#262626] rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Menu Lainnya</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center gap-2 p-3 bg-[#1A1A1A] rounded-xl border border-[#262626] hover:border-teal-500/50 transition-colors"
                >
                  <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
                  <span className="text-xs text-zinc-400">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}