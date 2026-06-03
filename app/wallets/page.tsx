'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, CreditCard, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<{ id: string; name: string; balance: number }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'NEW' | 'TOPUP' | 'TARIK'>('NEW');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', amount: '' });

  const handleSave = () => {
    let updated;
    const amountVal = parseFloat(formData.amount.replace(/\D/g, '')) || 0;
    
    if (modalType === 'NEW') {
      if (!formData.name) return;
      updated = [...wallets, { id: crypto.randomUUID(), name: formData.name, balance: amountVal }];
    } else {
      updated = wallets.map(w => {
        if (w.id === selectedWalletId) {
          return { 
            ...w, 
            balance: typeof w.balance !== 'number' ? 0 : 
               modalType === 'TOPUP' ? w.balance + amountVal : Math.max(0, w.balance - amountVal) 
          };
        }
        return w;
      });
    }
    setWallets(updated);
    localStorage.setItem('equilibria_wallets', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem('equilibria_wallets');
    if (stored) {
      // eslint-disable-next-line
      setWallets(JSON.parse(stored));
    } else {
      const initial = [
        { id: '1', name: 'BCA Utama', balance: 5000000 },
        { id: '2', name: 'Gopay', balance: 150000 },
        { id: '3', name: 'Cash', balance: 350000 },
      ];
      // eslint-disable-next-line
      setWallets(initial);
      localStorage.setItem('equilibria_wallets', JSON.stringify(initial));
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
            <Wallet className="w-6 h-6 text-teal-400" />
            Multi-Dompet
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Kelola berbagai rekening dan dompet digital dalam satu tempat.</p>
        </div>
        <button onClick={() => { setModalType('NEW'); setFormData({ name: '', amount: '' }); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Dompet
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map(wallet => (
          <div key={wallet.id} className="bg-[#141414] border border-[#262626] rounded-xl p-6 relative group hover:border-teal-500/50 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-[#1A1A1A] rounded-lg">
                <CreditCard className="w-6 h-6 text-zinc-400" />
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-400">{wallet.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{formatIDR(wallet.balance)}</h3>
            </div>
            <div className="mt-6 flex justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => { setSelectedWalletId(wallet.id); setModalType('TARIK'); setFormData({ name: '', amount: '' }); setIsModalOpen(true); }} className="flex-1 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-xs font-semibold text-rose-400 flex items-center justify-center gap-1">
                 <ArrowDownRight className="w-4 h-4" /> Tarik
               </button>
               <button onClick={() => { setSelectedWalletId(wallet.id); setModalType('TOPUP'); setFormData({ name: '', amount: '' }); setIsModalOpen(true); }} className="flex-1 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-xs font-semibold text-teal-400 flex items-center justify-center gap-1">
                 <ArrowUpRight className="w-4 h-4" /> Topup
               </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">
                {modalType === 'NEW' ? 'Tambah Dompet Baru' : modalType === 'TOPUP' ? 'Topup Dompet' : 'Tarik Saldo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modalType === 'NEW' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Dompet</label>
                  <input type="text" placeholder="Contoh: BCA Utama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                <input type="text" placeholder="Rp..." value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={modalType === 'NEW' ? (!formData.name || !formData.amount) : !formData.amount} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
