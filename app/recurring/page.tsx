'use client';

import { useState, useEffect } from 'react';
import { Repeat, Plus, CalendarClock, X, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export default function RecurringPage() {
  const { formatCurrency } = useSettings();
  const [recurring, setRecurring] = useState<{ id: string; name: string; amount: number; frequency: string; nextDate: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: '', frequency: 'Bulanan', nextDate: '' });
  const [editingItem, setEditingItem] = useState<typeof recurring[0] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      const res = await fetch('/api/recurring');
      const data = await res.json();
      if (data.recurring && data.recurring.length > 0) {
        setRecurring(data.recurring);
      } else {
        const stored = localStorage.getItem('equilibria_recurring');
        if (stored) {
          setRecurring(JSON.parse(stored));
        } else {
          const initial = [
            { id: '1', name: 'Langganan Netflix', amount: 153000, frequency: 'Bulanan', nextDate: '2026-06-15' },
            { id: '2', name: 'Biaya Kost / Sewa', amount: 2000000, frequency: 'Bulanan', nextDate: '2026-06-10' },
          ];
          setRecurring(initial);
          localStorage.setItem('equilibria_recurring', JSON.stringify(initial));
        }
      }
    } catch (error) {
      const stored = localStorage.getItem('equilibria_recurring');
      if (stored) setRecurring(JSON.parse(stored));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.amount || !formData.nextDate) return;
    setIsSaving(true);
    const amountVal = parseFloat(formData.amount.replace(/\D/g, '')) || 0;

    try {
      if (editingItem) {
        const res = await fetch('/api/recurring', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, name: formData.name, amount: amountVal, frequency: formData.frequency, nextDate: formData.nextDate }),
        });
        const data = await res.json();
        if (data.recurring) {
          const updated = recurring.map(r => r.id === editingItem.id ? data.recurring : r);
          setRecurring(updated);
          localStorage.setItem('equilibria_recurring', JSON.stringify(updated));
        }
      } else {
        const res = await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, amount: amountVal, frequency: formData.frequency, nextDate: formData.nextDate }),
        });
        const data = await res.json();
        if (data.recurring) {
          const updated = [...recurring, data.recurring];
          setRecurring(updated);
          localStorage.setItem('equilibria_recurring', JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Error saving recurring:', error);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch('/api/recurring', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const updated = recurring.filter(r => r.id !== id);
      setRecurring(updated);
      localStorage.setItem('equilibria_recurring', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting recurring:', error);
    }
    setDeletingId(null);
  };

  const openEditModal = (item: typeof recurring[0]) => {
    setEditingItem(item);
    setFormData({ name: item.name, amount: item.amount.toString(), frequency: item.frequency, nextDate: item.nextDate });
    setIsModalOpen(true);
  };

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
        <button onClick={() => { setFormData({ name: '', amount: '', frequency: 'Bulanan', nextDate: new Date().toISOString().split('T')[0] }); setEditingItem(null); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Buat Jadwal
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : (
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
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => openEditModal(item)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                   <Pencil className="w-4 h-4" />
                 </button>
                 <button onClick={() => setDeletingId(item.id)} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                   <Trash2 className="w-4 h-4" />
                 </button>
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
              <h3 className="font-bold text-lg text-white">{editingItem ? 'Edit Jadwal Transaksi' : 'Buat Jadwal Transaksi'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="text-zinc-400 hover:text-white transition-colors">
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
              <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!formData.name || !formData.amount || !formData.nextDate} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
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
                  <h3 className="text-xl font-bold text-white">Hapus Jadwal?</h3>
                  <p className="text-sm text-zinc-400 mt-2">
                    Tindakan ini tidak dapat dibatalkan. Jadwal transaksi otomatis akan dihapus secara permanen.
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
                    onClick={() => handleDeleteItem(deletingId)}
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
