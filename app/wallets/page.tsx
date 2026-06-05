'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, CreditCard, ArrowUpRight, ArrowDownRight, X, Trash2, AlertTriangle, Pencil, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

interface WalletItem {
  id: string;
  name: string;
  balance: number;
  description?: string;
  currency?: string;
}

const CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah Indonesia', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 16000 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 17500 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 12000 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 3500 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 110 },
];

export default function WalletsPage() {
  const { formatCurrency } = useSettings();
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'NEW' | 'TOPUP' | 'TARIK' | 'EDIT'>('NEW');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', amount: '', description: '', currency: 'IDR' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState<WalletItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch wallets from API
  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      if (data.wallets && data.wallets.length > 0) {
        setWallets(data.wallets);
      } else {
        // Fallback to localStorage if no data in DB
        const stored = localStorage.getItem('equilibria_wallets');
        if (stored) {
          setWallets(JSON.parse(stored));
        } else {
          // Set initial data with multi-currency
          const initial: WalletItem[] = [
            { id: '1', name: 'BCA Utama', balance: 5000000, description: 'Rekening utama untuk transaksi harian', currency: 'IDR' },
            { id: '2', name: 'Gopay', balance: 150000, description: 'Dompet digital untuk pembayaran online', currency: 'IDR' },
            { id: '3', name: 'Cash', balance: 350000, description: 'Uang tunai di dompet', currency: 'IDR' },
            { id: '4', name: 'Travel Fund', balance: 100, description: 'Dollar savings for travel', currency: 'USD' },
          ];
          setWallets(initial);
          localStorage.setItem('equilibria_wallets', JSON.stringify(initial));
        }
      }
    } catch (error) {
      // Fallback to localStorage on error
      const stored = localStorage.getItem('equilibria_wallets');
      if (stored) {
        setWallets(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const amountVal = parseFloat(formData.amount.replace(/\D/g, '')) || 0;

    try {
      if (modalType === 'NEW') {
        const res = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, balance: amountVal, description: formData.description }),
        });
        const data = await res.json();
        if (data.wallet) {
          const newWallet = { ...data.wallet, description: formData.description };
          const updated = [...wallets, newWallet];
          setWallets(updated);
          localStorage.setItem('equilibria_wallets', JSON.stringify(updated));
        }
      } else if (modalType === 'EDIT' && editingWallet) {
        const res = await fetch('/api/wallets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingWallet.id, name: formData.name, balance: amountVal, description: formData.description }),
        });
        const data = await res.json();
        if (data.wallet) {
          const updatedWallet = { ...data.wallet, description: formData.description };
          const updated = wallets.map(w => w.id === editingWallet.id ? updatedWallet : w);
          setWallets(updated);
          localStorage.setItem('equilibria_wallets', JSON.stringify(updated));
        }
      } else if (selectedWalletId) {
        const wallet = wallets.find(w => w.id === selectedWalletId);
        if (wallet) {
          const newBalance = modalType === 'TOPUP' ? wallet.balance + amountVal : Math.max(0, wallet.balance - amountVal);
          const res = await fetch('/api/wallets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedWalletId, balance: newBalance }),
          });
          const data = await res.json();
          if (data.wallet) {
            const updated = wallets.map(w => w.id === selectedWalletId ? data.wallet : w);
            setWallets(updated);
            localStorage.setItem('equilibria_wallets', JSON.stringify(updated));
          }
        }
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingWallet(null);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    try {
      await fetch('/api/wallets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const updated = wallets.filter(w => w.id !== id);
      setWallets(updated);
      localStorage.setItem('equilibria_wallets', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
    setDeletingId(null);
  };

  const openEditModal = (wallet: WalletItem) => {
    setEditingWallet(wallet);
    setFormData({ name: wallet.name, amount: wallet.balance.toString(), description: wallet.description || '', currency: wallet.currency || 'IDR' });
    setModalType('EDIT');
    setIsModalOpen(true);
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
        <button onClick={() => { setModalType('NEW'); setFormData({ name: '', amount: '', description: '', currency: 'IDR' }); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Dompet
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map(wallet => {
            const currency = CURRENCIES.find(c => c.code === (wallet.currency || 'IDR')) || CURRENCIES[0];
            const displayBalance = currency.code === 'IDR'
              ? formatCurrency(wallet.balance)
              : `${currency.symbol} ${wallet.balance.toLocaleString('id-ID')}`;
            return (
              <div key={wallet.id} className="bg-[#141414] border border-[#262626] rounded-xl p-6 relative group hover:border-teal-500/50 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-[#1A1A1A] rounded-lg">
                    <CreditCard className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(wallet)}
                      className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(wallet.id)}
                      className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">{wallet.name}</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{displayBalance}</h3>
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded mt-1 inline-block">
                    {currency.code}
                  </span>
                  {wallet.description && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{wallet.description}</p>
                  )}
                </div>
              <div className="mt-6 flex justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setSelectedWalletId(wallet.id); setModalType('TARIK'); setFormData({ name: '', amount: '', description: '', currency: wallet.currency || 'IDR' }); setIsModalOpen(true); }} className="flex-1 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-xs font-semibold text-rose-400 flex items-center justify-center gap-1">
                     <ArrowDownRight className="w-4 h-4" /> Tarik
                   </button>
                   <button onClick={() => { setSelectedWalletId(wallet.id); setModalType('TOPUP'); setFormData({ name: '', amount: '', description: '', currency: wallet.currency || 'IDR' }); setIsModalOpen(true); }} className="flex-1 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-xs font-semibold text-teal-400 flex items-center justify-center gap-1">
                     <ArrowUpRight className="w-4 h-4" /> Topup
                   </button>
                 </div>
               </div>
             );
           })}
         </div>
       )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">
                {modalType === 'NEW' ? 'Tambah Dompet Baru' : modalType === 'EDIT' ? 'Edit Dompet' : modalType === 'TOPUP' ? 'Topup Dompet' : 'Tarik Saldo'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingWallet(null); }} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modalType === 'NEW' || modalType === 'EDIT' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Dompet</label>
                    <input type="text" placeholder="Contoh: BCA Utama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mata Uang</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({...formData, currency: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Deskripsi</label>
                    <textarea
                      placeholder="Contoh: Rekening utama untuk transaksi harian"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none resize-none h-20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Saldo Awal</label>
                    <input type="text" placeholder="Rp..." value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                  </div>
                </>
              ) : null}
              {(modalType === 'TOPUP' || modalType === 'TARIK') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                  <input type="text" placeholder="Rp..." value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => { setIsModalOpen(false); setEditingWallet(null); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={isSaving || (modalType === 'NEW' || modalType === 'EDIT' ? (!formData.name || !formData.amount) : !formData.amount)} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50 flex items-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hapus Dompet?</h3>
                  <p className="text-sm text-zinc-400 mt-2">
                    Tindakan ini tidak dapat dibatalkan. Dompet dan saldonya akan dihapus secara permanen.
                  </p>
                </div>
                <div className="flex w-full gap-3 pt-4">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-white font-medium text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteWallet(deletingId)}
                    className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
