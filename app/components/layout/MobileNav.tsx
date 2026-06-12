'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Receipt, Wallet, Target, Settings, LayoutGrid, CreditCard, RefreshCw, Bell, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/transactions', icon: Receipt, label: 'Transaksi' },
  { href: '/wallets', icon: Wallet, label: 'Dompet' },
  { href: '/goals', icon: Target, label: 'Target' },
  { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

const moreMenuItems = [
  { href: '/budgets', label: 'Budget', icon: CreditCard, color: 'text-teal-400' },
  { href: '/debts', label: 'Hutang', icon: RefreshCw, color: 'text-rose-400' },
  { href: '/recurring', label: 'Auto', icon: RefreshCw, color: 'text-amber-400' },
  { href: '/reminders', label: 'Reminder', icon: Bell, color: 'text-purple-400' },
  { href: '/summary', label: 'Summary', icon: LayoutGrid, color: 'text-blue-400' },
  { href: '/statistics', label: 'Statistik', icon: BarChart3, color: 'text-cyan-400' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Bottom Navigation */}
          <nav
        className="2xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/98 backdrop-blur-xl border-t border-[#262626] safe-area-pb"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-14
                ${isActive(item.href)
                  ? 'text-teal-400 bg-teal-500/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
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
            aria-label="Buka menu lainnya"
            className={`
              flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-14
              ${isMenuOpen ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
            `}
          >
            <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-medium">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* Overlay Menu */}
      {isMenuOpen && (
        <div className="2xl:hidden fixed inset-0 z-50" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="absolute bottom-20 left-0 right-0 bg-[#141414]/98 backdrop-blur-xl border-t border-[#262626] rounded-t-3xl p-5 max-h-[65vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-base font-semibold text-white">Menu Lainnya</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Tutup menu"
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-3 gap-3">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center gap-2 p-4 bg-[#1A1A1A] rounded-2xl border border-[#262626] hover:border-teal-500/50 hover:bg-[#1f1f1f] transition-all duration-200 active:scale-95"
                >
                  <div className={`p-2 bg-zinc-800/50 rounded-xl ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[#262626] text-center">
              <p className="text-xs text-zinc-600">Equilibria Finance App v2.0</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 8px);
        }
      `}</style>
    </>
  );
}