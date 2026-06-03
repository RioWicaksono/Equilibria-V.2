'use client';

import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export default function SummaryClient({ allTransactions }: { allTransactions: any[] }) {
  const { formatCurrency } = useSettings();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const filtered = useMemo(() => {
    return allTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, filterMonth, filterYear]);

  const totalIncome = filtered.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  const years = Array.from(new Set(allTransactions.map(t => new Date(t.date).getFullYear()))).sort((a,b)=>b-a);
  if (years.length === 0) years.push(new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-[#141414] border border-[#262626] rounded-xl p-4 print:hidden">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Bulan</label>
          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500"
          >
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Tahun</label>
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-teal-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto mt-4 sm:mt-0">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-lg text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Report Core */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-10 print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white print:text-black">E-Statement</h1>
          <p className="text-zinc-500 mt-1">Periode: {filterMonth + 1}/{filterYear}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#262626] print:border-zinc-300 print:bg-transparent">
            <p className="text-sm text-zinc-500 mb-1">Total Pemasukan</p>
            <p className="text-xl font-bold text-teal-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#262626] print:border-zinc-300 print:bg-transparent">
            <p className="text-sm text-zinc-500 mb-1">Total Pengeluaran</p>
            <p className="text-xl font-bold text-rose-400">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#262626] print:border-zinc-300 print:bg-transparent">
            <p className="text-sm text-zinc-500 mb-1">Net (Saldo)</p>
            <p className={`text-xl font-bold ${net >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>{formatCurrency(net)}</p>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#262626] print:border-zinc-300 text-zinc-500">
              <th className="pb-3 font-medium">Tanggal</th>
              <th className="pb-3 font-medium">Kategori</th>
              <th className="pb-3 font-medium">Deskripsi</th>
              <th className="pb-3 font-medium text-right">Mutasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626] print:divide-zinc-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-500">
                  Tidak ada transaksi di periode ini.
                </td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="text-zinc-300 print:text-zinc-800">
                  <td className="py-4 font-mono">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                  <td className="py-4">{t.category}</td>
                  <td className="py-4">{t.description || "-"}</td>
                  <td className={`py-4 text-right font-medium ${t.type === 'INCOME' ? 'text-teal-400' : 'text-rose-400'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
