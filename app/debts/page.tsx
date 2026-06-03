'use client';

import { useState, useEffect } from 'react';
import { HandCoins, Plus, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';

export default function DebtsPage() {
  const [debts, setDebts] = useState<{ id: string; name: string; amount: number; paidAmount: number; type: 'DEBT' | 'LOAN'; status: 'UNPAID' | 'PAID' }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ name: string; amount: string; type: 'DEBT' | 'LOAN' }>({ name: '', amount: '', type: 'DEBT' });
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  const handleSave = () => {
    if (!formData.name || !formData.amount) return;
    const amountVal = parseFloat(formData.amount.replace(/\D/g, '')) || 0;
    const updated: typeof debts = [
      ...debts, 
      { id: crypto.randomUUID(), name: formData.name, amount: amountVal, paidAmount: 0, type: formData.type, status: 'UNPAID' }
    ];
    setDebts(updated);
    localStorage.setItem('equilibria_debts', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handlePay = () => {
    if (!selectedDebtId || !payAmount) return;
    const pVal = parseFloat(payAmount.replace(/\D/g, '')) || 0;
    
    let updated = debts.map(d => {
        if (d.id === selectedDebtId) {
            const newPaid = (d.paidAmount || 0) + pVal;
            return { ...d, paidAmount: newPaid };
        }
        return d;
    });
    
    // Auto-remove if fully paid
    updated = updated.filter(d => d.amount - (d.paidAmount || 0) > 0);

    setDebts(updated);
    localStorage.setItem('equilibria_debts', JSON.stringify(updated));
    setIsPayModalOpen(false);
    setPayAmount('');
    setSelectedDebtId(null);
  };

  useEffect(() => {
    const stored = localStorage.getItem('equilibria_debts');
    if (stored) {
      const parsed = JSON.parse(stored);
      // eslint-disable-next-line
      setDebts(parsed.map((d: any) => ({ ...d, paidAmount: d.paidAmount || 0 })));
    } else {
      const initial: typeof debts = [
        { id: '1', name: 'Pinjam ke Budi', amount: 500000, paidAmount: 0, type: 'DEBT', status: 'UNPAID' },
        { id: '2', name: 'Bayar Makan Siang Andi', amount: 150000, paidAmount: 50000, type: 'LOAN', status: 'UNPAID' },
      ];
      // eslint-disable-next-line
      setDebts(initial);
      localStorage.setItem('equilibria_debts', JSON.stringify(initial));
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
            <HandCoins className="w-6 h-6 text-teal-400" />
            Catatan Hutang & Piutang
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Kelola pinjaman dan uang yang dipinjamkan ke orang lain.</p>
        </div>
        <button onClick={() => { setFormData({ name: '', amount: '', type: 'DEBT' }); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Catat Transaksi Baru
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Kolom Hutang (Kiri) */}
        <div className="space-y-4">
          <h3 className="text-lg flex items-center justify-between font-bold text-rose-400 border-b border-zinc-800 pb-3">
            <span>Hutang Anda</span>
            <span className="text-sm bg-rose-500/10 px-2 py-0.5 rounded text-rose-400">{debts.filter(d => d.type === 'DEBT').length}</span>
          </h3>
          <div className="space-y-4">
            {debts.filter(d => d.type === 'DEBT').length === 0 ? (
              <p className="text-sm text-zinc-500 italic py-4 text-center border border-dashed border-zinc-800 rounded-xl">Tidak ada hutang aktif.</p>
            ) : debts.filter(d => d.type === 'DEBT').map(debt => (
              <div key={debt.id} className="bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{debt.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded mt-2 inline-block">Hutang Harus Dibayar</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-rose-400">{formatIDR(debt.amount - (debt.paidAmount || 0))}</p>
                    <p className="text-xs text-zinc-500 font-medium">Sisa Tagihan</p>
                  </div>
                </div>

                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, ((debt.paidAmount || 0) / debt.amount) * 100)}%` }} />
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                  <div className="text-xs">
                    <p className="text-zinc-500">Total: <span className="text-zinc-300">{formatIDR(debt.amount)}</span></p>
                    <p className="text-zinc-500">Terbayar: <span className="text-white">{formatIDR(debt.paidAmount || 0)}</span></p>
                  </div>
                  <button onClick={() => { setSelectedDebtId(debt.id); setPayAmount(''); setIsPayModalOpen(true); }} className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] text-white text-xs font-semibold rounded-lg transition-colors">
                    Bayar / Cicil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Piutang (Kanan) */}
        <div className="space-y-4">
          <h3 className="text-lg flex items-center justify-between font-bold text-teal-400 border-b border-zinc-800 pb-3">
            <span>Piutang (Uang Anda di Orang Lain)</span>
            <span className="text-sm bg-teal-500/10 px-2 py-0.5 rounded text-teal-400">{debts.filter(d => d.type === 'LOAN').length}</span>
          </h3>
          <div className="space-y-4">
            {debts.filter(d => d.type === 'LOAN').length === 0 ? (
              <p className="text-sm text-zinc-500 italic py-4 text-center border border-dashed border-zinc-800 rounded-xl">Tidak ada piutang aktif.</p>
            ) : debts.filter(d => d.type === 'LOAN').map(debt => (
              <div key={debt.id} className="bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{debt.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded mt-2 inline-block">Piutang Menunggu</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal-400">{formatIDR(debt.amount - (debt.paidAmount || 0))}</p>
                    <p className="text-xs text-zinc-500 font-medium">Sisa Menunggu</p>
                  </div>
                </div>

                <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, ((debt.paidAmount || 0) / debt.amount) * 100)}%` }} />
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                  <div className="text-xs">
                    <p className="text-zinc-500">Total: <span className="text-zinc-300">{formatIDR(debt.amount)}</span></p>
                    <p className="text-zinc-500">Diterima: <span className="text-white">{formatIDR(debt.paidAmount || 0)}</span></p>
                  </div>
                  <button onClick={() => { setSelectedDebtId(debt.id); setPayAmount(''); setIsPayModalOpen(true); }} className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] text-white text-xs font-semibold rounded-lg transition-colors">
                    Terima Cicilan Lunas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">Catat Hutang/Piutang Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama / Catatan</label>
                <input type="text" placeholder="Contoh: Pinjam ke Budi" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                <input type="text" placeholder="Rp..." value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer border-[#262626] ${formData.type === 'DEBT' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-[#1A1A1A] text-zinc-400 hover:bg-zinc-800'}`}>
                    <input type="radio" className="hidden" name="type" checked={formData.type === 'DEBT'} onChange={() => setFormData({...formData, type: 'DEBT'})} />
                    <ArrowDownRight className="w-4 h-4" /> Hutang (Harus Bayar)
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer border-[#262626] ${formData.type === 'LOAN' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-[#1A1A1A] text-zinc-400 hover:bg-zinc-800'}`}>
                    <input type="radio" className="hidden" name="type" checked={formData.type === 'LOAN'} onChange={() => setFormData({...formData, type: 'LOAN'})} />
                    <ArrowUpRight className="w-4 h-4" /> Piutang (Meminjamkan)
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!formData.name || !formData.amount} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">Catat Pembayaran / Cicilan</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal Pembayaran</label>
                <input type="text" placeholder="Rp..." value={payAmount} onChange={e => setPayAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <p className="text-xs text-zinc-500">Catatan: Jika nominal dirasa melunasi semua sisa tagihan, data otomatis dianggap selesai / terhapus.</p>
            </div>
            <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!payAmount} onClick={handlePay} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan Pembayaran</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
