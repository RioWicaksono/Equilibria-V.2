'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, X, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description?: string;
}

export default function GoalsPage() {
  const { formatCurrency } = useSettings();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', targetAmount: '', currentAmount: '', deadline: '', description: '' });
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      if (data.goals && data.goals.length > 0) {
        setGoals(data.goals);
      } else {
        const stored = localStorage.getItem('equilibria_goals');
        if (stored) {
          setGoals(JSON.parse(stored));
        } else {
          const initial: GoalItem[] = [
            { id: '1', name: 'Dana Darurat', targetAmount: 20000000, currentAmount: 5000000, deadline: '2026-12-31', description: 'Dana cadangan untuk keadaan darurat' },
            { id: '2', name: 'Liburan ke Bali', targetAmount: 7000000, currentAmount: 1500000, deadline: '2026-08-15', description: 'Tabungan untuk berwisata ke Bali bersama keluarga' },
          ];
          setGoals(initial);
          localStorage.setItem('equilibria_goals', JSON.stringify(initial));
        }
      }
    } catch {
      const stored = localStorage.getItem('equilibria_goals');
      if (stored) setGoals(JSON.parse(stored));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.targetAmount || !formData.deadline) return;
    setIsSaving(true);
    const targetVal = parseFloat(formData.targetAmount.replace(/\D/g, '')) || 0;
    const currentVal = parseFloat(formData.currentAmount.replace(/\D/g, '')) || 0;

    try {
      if (editingGoal) {
        const res = await fetch('/api/goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingGoal.id, name: formData.name, targetAmount: targetVal, currentAmount: currentVal, deadline: formData.deadline, description: formData.description }),
        });
        const data = await res.json();
        if (data.goal) {
          const updatedGoal = { ...data.goal, description: formData.description };
          const updated = goals.map(g => g.id === editingGoal.id ? updatedGoal : g);
          setGoals(updated);
          localStorage.setItem('equilibria_goals', JSON.stringify(updated));
        }
      } else {
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, targetAmount: targetVal, currentAmount: currentVal, deadline: formData.deadline, description: formData.description }),
        });
        const data = await res.json();
        if (data.goal) {
          const newGoal = { ...data.goal, description: formData.description };
          const updated = [...goals, newGoal];
          setGoals(updated);
          localStorage.setItem('equilibria_goals', JSON.stringify(updated));
        }
      }
    } catch {
      console.error('Error saving goal');
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingGoal(null);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      localStorage.setItem('equilibria_goals', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
    setDeletingId(null);
  };

  const openEditModal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      description: goal.description || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-2xl font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
            Target Tabungan
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Pantau progress pencapaian finansial Anda secara berkala.</p>
        </div>
        <button onClick={() => { setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: new Date().toISOString().split('T')[0], description: '' }); setEditingGoal(null); setIsModalOpen(true); }} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Target
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id} className="bg-[#141414] border border-[#262626] rounded-xl p-6 relative group hover:border-teal-500/50 transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <div className="flex-1">
                   <h3 className="font-bold text-lg text-white">{goal.name}</h3>
                   {goal.description && (
                     <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{goal.description}</p>
                   )}
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openEditModal(goal)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                     <Pencil className="w-4 h-4" />
                   </button>
                   <button onClick={() => setDeletingId(goal.id)} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
               <div className="flex justify-between text-sm mb-2 mt-2">
                 <span className="text-teal-400 font-medium">{formatCurrency(goal.currentAmount)}</span>
                 <span className="text-zinc-500">{formatCurrency(goal.targetAmount)}</span>
               </div>

               <div className="h-2 w-full bg-[#1A1A1A] border border-[#262626] rounded-full overflow-hidden">
                 <div className="h-full bg-teal-500 rounded-full transition-all duration-1000 relative" style={{ width: `${percentage}%` }}>
                   <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                 </div>
               </div>

               <div className="flex justify-between items-center mt-2">
                 <p className="text-xs font-bold text-zinc-400">{percentage}% Tercapai</p>
                 <span className="text-xs font-semibold px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                   {new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                 </span>
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
              <h3 className="font-bold text-lg text-white">{editingGoal ? 'Edit Target Tabungan' : 'Tambah Target Tabungan'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingGoal(null); }} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Target</label>
                <input type="text" placeholder="Contoh: Beli Rumah" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Deskripsi</label>
                <textarea
                  placeholder="Contoh: Tabungan untuk membeli rumah pertama"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none resize-none h-20"
                />
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
              <button onClick={() => { setIsModalOpen(false); setEditingGoal(null); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!formData.name || !formData.targetAmount || !formData.deadline} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
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
                  <h3 className="text-xl font-bold text-white">Hapus Target?</h3>
                  <p className="text-sm text-zinc-400 mt-2">
                    Tindakan ini tidak dapat dibatalkan. Target tabungan akan dihapus secara permanen.
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
                    onClick={() => handleDeleteGoal(deletingId)}
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
