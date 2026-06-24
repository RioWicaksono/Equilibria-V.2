'use client';

import { useState, useEffect } from 'react';
import { HandCoins, Plus, ArrowDownRight, ArrowUpRight, X, Pencil, Trash2, AlertTriangle, Loader2, Calendar, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { apiFetch } from '@/lib/api-client';

interface DebtItem {
  id: string;
  name: string;
  amount: number;
  paidAmount: number;
  type: 'DEBT' | 'LOAN';
  status: 'UNPAID' | 'PAID';
  description?: string;
  loanDate?: string;
  dueDate?: string;
}

export default function DebtsPage() {
  const { formatCurrency } = useSettings();
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ name: string; amount: string; type: 'DEBT' | 'LOAN'; description: string; loanDate: string; dueDate: string }>({ name: '', amount: '', type: 'DEBT', description: '', loanDate: '', dueDate: '' });
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);

  // Check for debt reminders on mount
  useEffect(() => {
    fetchDebts().then(() => {
      // Check reminders after debts are loaded
      if (debts.length > 0) {
        checkDebtReminders(debts);
      }
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDebtReminders = (debtsList: DebtItem[]) => {
    if (debtsList.length === 0) return;

    const today = new Date();

    debtsList.forEach(debt => {
      if (debt.status === 'UNPAID' && debt.dueDate) {
        const dueDate = new Date(debt.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Use sessionStorage for reminder flags (cleared on tab close)
        const reminderKey = `debt_reminder_${debt.id}`;
        const alreadyReminded = sessionStorage.getItem(reminderKey);

        if (!alreadyReminded && daysUntilDue <= reminderDays && daysUntilDue >= 0) {
          // Send reminder
          sessionStorage.setItem(reminderKey, 'true');

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const isOverdue = daysUntilDue < 0;
            new Notification('Equilibria - Reminder Hutang/Piutang', {
              body: isOverdue
                ? `⚠️ "${debt.name}" sudah jatuh tempo! Sisa: ${formatCurrency(debt.amount - (debt.paidAmount || 0))}`
                : `📅 "${debt.name}" jatuh tempo dalam ${daysUntilDue} hari!`,
              icon: '/icon.svg',
              tag: reminderKey,
            });
          }

          // Telegram notification via API
          apiFetch('/api/telegram', {
            method: 'POST',
            body: JSON.stringify({
              message: daysUntilDue < 0
                ? `⚠️ *Reminder Hutang/Piutang*\n"${debt.name}" SUDAH JATUH TEMPO!\nSisa: ${formatCurrency(debt.amount - (debt.paidAmount || 0))}`
                : `📅 *Reminder Hutang/Piutang*\n"${debt.name}" jatuh tempo dalam ${daysUntilDue} hari\nSisa: ${formatCurrency(debt.amount - (debt.paidAmount || 0))}`
            }),
          }).catch(console.error);
        }
      }
    });
  };

  const fetchDebts = async () => {
    try {
      const data = await apiFetch<{ debts?: DebtItem[] }>('/api/debts');
      if (data.debts && data.debts.length > 0) {
        setDebts(data.debts);
        checkDebtReminders(data.debts);
      }
    } catch {
      console.error('Error fetching debts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.amount) return;
    setIsSaving(true);
    const amountVal = parseFloat(formData.amount.replace(/\D/g, '')) || 0;

    try {
      if (editingDebt) {
        const data = await apiFetch<{ debt?: DebtItem }>('/api/debts', {
          method: 'PUT',
          body: JSON.stringify({ id: editingDebt.id, name: formData.name, amount: amountVal, type: formData.type, description: formData.description, loanDate: formData.loanDate, dueDate: formData.dueDate }),
        });
        if (data.debt) {
          const updated = debts.map(d => d.id === editingDebt.id ? { ...d, name: formData.name, amount: amountVal, type: formData.type, description: formData.description, loanDate: formData.loanDate, dueDate: formData.dueDate } : d);
          setDebts(updated);
        }
      } else {
        const data = await apiFetch<{ debt?: DebtItem }>('/api/debts', {
          method: 'POST',
          body: JSON.stringify({ name: formData.name, amount: amountVal, type: formData.type, description: formData.description, loanDate: formData.loanDate, dueDate: formData.dueDate }),
        });
        if (data.debt) {
          const updated = [...debts, { ...data.debt, paidAmount: 0, description: formData.description, loanDate: formData.loanDate, dueDate: formData.dueDate }];
          setDebts(updated);
        }
      }
    } catch (error) {
      console.error('Error saving debt:', error);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingDebt(null);
    }
  };

  const handlePay = async () => {
    if (!selectedDebtId || !payAmount) return;
    const pVal = parseFloat(payAmount.replace(/\D/g, '')) || 0;

    try {
      const debt = debts.find(d => d.id === selectedDebtId);
      if (debt) {
        const newPaid = (debt.paidAmount || 0) + pVal;
        const data = await apiFetch<{ debt?: DebtItem }>('/api/debts', {
          method: 'PUT',
          body: { id: selectedDebtId, paidAmount: newPaid, status: newPaid >= debt.amount ? 'PAID' : 'UNPAID' },
        });
        if (data.debt) {
          const updatedDebt = data.debt;
          const updated: DebtItem[] = debts.map(d => d.id === selectedDebtId ? updatedDebt : d);
          const filtered = updated.filter((d) => d && d.status !== 'PAID');
          setDebts(filtered);
        }
      }
    } catch (error) {
      console.error('Error paying debt:', error);
    }
    setIsPayModalOpen(false);
    setPayAmount('');
    setSelectedDebtId(null);
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      await apiFetch('/api/debts', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      const updated = debts.filter(d => d.id !== id);
      setDebts(updated);
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
    setDeletingId(null);
  };

  const openEditModal = (debt: DebtItem) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      amount: debt.amount.toString(),
      type: debt.type,
      description: debt.description || '',
      loanDate: debt.loanDate || '',
      dueDate: debt.dueDate || ''
    });
    setIsModalOpen(true);
  };

  // Helper to check if debt is overdue
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  // Helper to get days until due
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
            <span>Hutang & Piutang</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Kelola pinjaman dan uang yang dipinjamkan.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Reminder Settings */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Bell className="w-4 h-4" />
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="bg-transparent border border-zinc-700 rounded px-2 py-1 text-zinc-400"
            >
              <option value={1}>1 hari</option>
              <option value={3}>3 hari</option>
              <option value={7}>7 hari</option>
              <option value={14}>14 hari</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', amount: '', type: 'DEBT', description: '', loanDate: '', dueDate: '' });
              setEditingDebt(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-2 sm:px-4 bg-teal-500 hover:bg-teal-400 text-black text-xs sm:text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Kolom Hutang (Kiri) */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg flex items-center justify-between font-bold text-rose-400 border-b border-zinc-800 pb-2">
            <span>Hutang</span>
            <span className="text-xs bg-rose-500/10 px-2 py-0.5 rounded text-rose-400">{debts.filter(d => d.type === 'DEBT').length}</span>
          </h3>
          <div className="space-y-3">
            {debts.filter(d => d.type === 'DEBT').length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center border border-dashed border-zinc-800 rounded-xl">Tidak ada hutang aktif.</p>
            ) : debts.filter(d => d.type === 'DEBT').map(debt => {
              const overdue = debt.dueDate && isOverdue(debt.dueDate);
              const daysUntil = debt.dueDate ? getDaysUntilDue(debt.dueDate) : null;
              return (
                <div key={debt.id} className={`bg-[#141414] border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-rose-500/30 transition-colors ${overdue ? 'border-rose-500/50' : ''}`}>
                  {overdue && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                      OVERDUE
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{debt.name}</h4>
                      {debt.description && (
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{debt.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEditModal(debt)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(debt.id)} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-rose-400">{formatCurrency(debt.amount - (debt.paidAmount || 0))}</p>
                      <p className="text-[10px] text-zinc-500">Sisa</p>
                    </div>
                  </div>

                  <div className="w-full bg-[#1A1A1A] h-1 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, ((debt.paidAmount || 0) / debt.amount) * 100)}%` }} />
                  </div>

                  {debt.dueDate && (
                    <div className={`flex items-center gap-2 text-[10px] pt-2 border-t border-[#262626] ${overdue ? 'text-rose-400' : daysUntil && daysUntil <= reminderDays ? 'text-amber-400' : 'text-zinc-500'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>
                        {overdue ? `Jatuh tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID')}` : `Jatuh tempo: ${daysUntil} hari lagi`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                    <div className="text-[10px]">
                      <span className="text-zinc-500">Total: <span className="text-zinc-300">{formatCurrency(debt.amount)}</span></span>
                    </div>
                    <button
                      onClick={() => { setSelectedDebtId(debt.id); setPayAmount(''); setIsPayModalOpen(true); }}
                      className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] text-white text-[10px] font-semibold rounded-lg transition-colors"
                    >
                      Bayar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Piutang (Kanan) */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg flex items-center justify-between font-bold text-teal-400 border-b border-zinc-800 pb-2">
            <span>Piutang</span>
            <span className="text-xs bg-teal-500/10 px-2 py-0.5 rounded text-teal-400">{debts.filter(d => d.type === 'LOAN').length}</span>
          </h3>
          <div className="space-y-3">
            {debts.filter(d => d.type === 'LOAN').length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center border border-dashed border-zinc-800 rounded-xl">Tidak ada piutang aktif.</p>
            ) : debts.filter(d => d.type === 'LOAN').map(debt => {
              const overdue = debt.dueDate && isOverdue(debt.dueDate);
              const daysUntil = debt.dueDate ? getDaysUntilDue(debt.dueDate) : null;
              return (
                <div key={debt.id} className={`bg-[#141414] border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-teal-500/30 transition-colors ${overdue ? 'border-amber-500/50' : ''}`}>
                  {overdue && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                      OVERDUE
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{debt.name}</h4>
                      {debt.description && (
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{debt.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEditModal(debt)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(debt.id)} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-teal-400">{formatCurrency(debt.amount - (debt.paidAmount || 0))}</p>
                      <p className="text-[10px] text-zinc-500">Sisa</p>
                    </div>
                  </div>

                  <div className="w-full bg-[#1A1A1A] h-1 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, ((debt.paidAmount || 0) / debt.amount) * 100)}%` }} />
                  </div>

                  {debt.dueDate && (
                    <div className={`flex items-center gap-2 text-[10px] pt-2 border-t border-[#262626] ${overdue ? 'text-amber-400' : daysUntil && daysUntil <= reminderDays ? 'text-amber-400' : 'text-zinc-500'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>
                        {overdue ? `Jatuh tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID')}` : `Jatuh tempo: ${daysUntil} hari lagi`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                    <div className="text-[10px]">
                      <span className="text-zinc-500">Total: <span className="text-zinc-300">{formatCurrency(debt.amount)}</span></span>
                    </div>
                    <button
                      onClick={() => { setSelectedDebtId(debt.id); setPayAmount(''); setIsPayModalOpen(true); }}
                      className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] text-white text-[10px] font-semibold rounded-lg transition-colors"
                    >
                      Terima
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      )}

      {/* Modal forms remain the same */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/80">
              <h3 className="font-bold text-base text-white">{editingDebt ? 'Edit' : 'Tambah'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingDebt(null); }} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama</label>
                <input type="text" placeholder="Nama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pinjam</label>
                  <input type="date" value={formData.loanDate} onChange={e => setFormData({...formData, loanDate: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jatuh Tempo</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                <input type="text" placeholder="Rp" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'DEBT'})}
                  className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${formData.type === 'DEBT' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-[#1A1A1A] border-[#262626] text-zinc-400'}`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Hutang
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'LOAN'})}
                  className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${formData.type === 'LOAN' ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-[#1A1A1A] border-[#262626] text-zinc-400'}`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Piutang
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3">
              <button onClick={() => { setIsModalOpen(false); setEditingDebt(null); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!formData.name || !formData.amount} onClick={handleSave} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/80">
              <h3 className="font-bold text-base text-white">Pembayaran</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                <input type="text" placeholder="Rp" value={payAmount} onChange={e => setPayAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))} className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3">
              <button onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg">Batal</button>
              <button disabled={!payAmount} onClick={handlePay} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg disabled:opacity-50">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Hapus?</h3>
                  <p className="text-xs text-zinc-400 mt-2">Data akan dihapus permanen.</p>
                </div>
                <div className="flex w-full gap-3 pt-2">
                  <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-white text-sm font-medium">Batal</button>
                  <button onClick={() => handleDeleteDebt(deletingId)} className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-sm">Hapus</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}