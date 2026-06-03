'use client';

import { useState, useEffect } from 'react';
import { Repeat, Plus, CalendarClock, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function RecurringPage() {
  const { formatCurrency } = useSettings();
  const [recurring, setRecurring] = useState<{ id: string; name: string; amount: number; frequency: string; nextDate: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: '', frequency: 'Bulanan', nextDate: '' });

  const handleSave = () => {
    if (!formData.name || !formData.amount || !formData.nextDate) return;
    const amountVal = parseFloat(formData.amount.replace(/\D/g, '')) || 0;
    
    const updated = [...recurring, {
      id: crypto.randomUUID(),
      name: formData.name,
      amount: amountVal,
      frequency: formData.frequency,
      nextDate: formData.nextDate
    }];
    setRecurring(updated);
    localStorage.setItem('equilibria_recurring', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem('equilibria_recurring');
    if (stored) {
      // eslint-disable-next-line
      setRecurring(JSON.parse(stored));
    } else {
      const initial = [
        { id: '1', name: 'Langganan Netflix', amount: 153000, frequency: 'Bulanan', nextDate: '2026-06-15' },
        { id: '2', name: 'Biaya Kost / Sewa', amount: 2000000, frequency: 'Bulanan', nextDate: '2026-06-10' },
      ];
      setRecurring(initial);
      localStorage.setItem('equilibria_recurring', JSON.stringify(initial));
    }
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Repeat className="w-6 h-6 text-teal-400" />
            Transaksi Otomatis
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Kelola langganan bulanan dan transaksi rutin yang otomatis tercatat.</p>
        </div>
        <button onClick={() => { setFormData({ name: '', amount: '', frequency: 'Bulanan', nextDate: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Buat Jadwal
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurring.map(item => (
          <div key={item.id} className="bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-zinc-700 transition-colors">
             <div className="flex justify-between items-start">
               <div>
                 <h4 className="font-bold text-white text-base mb-1">{item.name}</h4>
                 <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                   <Repeat className="w-3 h-3" /> {item.frequency}
                 </span>
               </div>
               <p className="text-lg font-bold text-rose-400">- {formatCurrency(item.amount)}</p>
             </div>
             
             <div className="mt-4 pt-4 border-t border-[#262626] flex justify-between items-center text-sm">
               <div className="flex items-center gap-2 text-zinc-500">
                 <CalendarClock className="w-4 h-4" />
                 <span>Jadwal Berikutnya: <strong className="text-zinc-300 font-medium">{new Date(item.nextDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
               </div>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">Buat Jadwal Transaksi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Transaksi</label>
                <input type="text" placeholder="Contoh: Langganan Netflix" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                <input type="text" placeholder="Rp..." value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Frekuensi</label>
                  <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none">
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Tahunan">Tahunan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mulai Tanggal</label>
                  <input type="date" value={formData.nextDate} onChange={e => setFormData({...formData, nextDate: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!formData.name || !formData.amount || !formData.nextDate} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
