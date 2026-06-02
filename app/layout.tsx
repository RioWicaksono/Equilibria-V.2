import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { LayoutDashboard, ArrowLeftRight, BookOpen, Wallet } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Equilibria - Financial Tracker',
  description: 'Aplikasi pencatatan keuangan pribadi oleh Rio. W',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans bg-[#0A0A0A] text-[#E5E5E5] min-h-screen flex flex-col md:flex-row overflow-hidden`}>
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-[#0D0D0D] border-r border-[#262626] flex flex-col p-6 flex-shrink-0 md:min-h-screen">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-black font-black">
                E
              </span> 
              Equilibria
            </h1>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">
              By Rio. W — Privacy First
            </p>
          </div>
          
          <nav className="flex-1 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
              Main Menu
            </div>
            <Link href="/" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/transactions" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors">
              <ArrowLeftRight className="h-5 w-5" />
              <span>Transaksi</span>
            </Link>
          </nav>

          <div className="absolute top-6 right-6 md:hidden">
            {/* Mobile menu toggle can be added here */}
          </div>
          
          <div className="mt-auto p-4 bg-[#141414] border border-zinc-800 rounded-xl text-[11px] hidden md:block">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full shadow-[0_0_8px_#2DD4BF]"></div>
              <span className="text-zinc-300 font-semibold">Sistem Aktif</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
          <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
