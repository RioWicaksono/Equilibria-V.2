'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, X } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState<{ id: string; name: string; targetAmount: number; currentAmount: number; deadline: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', targetAmount: '', currentAmount: '', deadline: '' });

  const handleSave = () => {
    if (!formData.name || !formData.targetAmount || !formData.deadline) return;
    const targetVal = parseFloat(formData.targetAmount.replace(/\D/g, '')) || 0;
    const currentVal = parseFloat(formData.currentAmount.replace(/\D/g, '')) || 0;
    
    const updated = [...goals, {
      id: crypto.randomUUID(),
      name: formData.name,
      targetAmount: targetVal,
      currentAmount: currentVal,
      deadline: formData.deadline
    }];
    setGoals(updated);
    localStorage.setItem('equilibria_goals', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem('equilibria_goals');
    if (stored) {
      // eslint-disable-next-line
      setGoals(JSON.parse(stored));
    } else {
      const initial = [
        { id: '1', name: 'Dana Darurat', targetAmount: 20000000, currentAmount: 5000000, deadline: '2026-12-31' },
        { id: '2', name: 'Liburan ke Bali', targetAmount: 7000000, currentAmount: 1500000, deadline: '2026-08-15' },
      ];
      // eslint-disable-next-line
      setGoals(initial);
      localStorage.setItem('equilibria_goals', JSON.stringify(initial));
    }
  }, []);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-teal-400" />
            Target Tabungan
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Pantau progress pencapaian finansial Anda secara berkala.</p>
        </div>
        <button onClick={() => { setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Target
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id} className="bg-[#141414] border border-[#262626] rounded-xl p-6 relative">
               <div className="flex justify-between items-start mb-4">
                 <h3 className="font-bold text-lg text-white">{goal.name}</h3>
                 <span className="text-xs font-semibold px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                   Target: {new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                 </span>
               </div>
               
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-teal-400 font-medium">{formatIDR(goal.currentAmount)}</span>
                 <span className="text-zinc-500">{formatIDR(goal.targetAmount)}</span>
               </div>
               
               <div className="h-2 w-full bg-[#1A1A1A] border border-[#262626] rounded-full overflow-hidden">
                 <div className="h-full bg-teal-500 rounded-full transition-all duration-1000 relative" style={{ width: `${percentage}%` }}>
                   <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                 </div>
               </div>
               
               <p className="text-right text-xs mt-2 font-bold text-zinc-400">{percentage}% Tercapai</p>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">Tambah Target Tabungan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Target</label>
                <input type="text" placeholder="Contoh: Beli Rumah" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Capaian</label>
                  <input type="text" placeholder="Rp..." value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Terkumpul Saat Ini</label>
                  <input type="text" placeholder="Rp..." value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tenggat Waktu</label>
                <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!formData.name || !formData.targetAmount || !formData.deadline} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
