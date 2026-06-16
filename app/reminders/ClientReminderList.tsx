'use client';

import { useState, useEffect } from 'react';
import { Bell, Edit2, Trash2, Plus, X, Search, Calendar, CheckCircle2, Circle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

interface Reminder {
  id: string;
  title: string;
  date: string;
  amount: number | null;
  status: 'PENDING' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  urgent: boolean;
}

export default function ClientReminderList() {
  const { formatCurrency } = useSettings();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    amount: null,
    status: 'PENDING',
    priority: 'MEDIUM',
    frequency: 'ONCE',
    urgent: false
  });

  useEffect(() => {
    const handleUpdate = () => {
      fetchReminders();
    };
    handleUpdate();
    window.addEventListener('reminders-updated', handleUpdate);
    return () => window.removeEventListener('reminders-updated', handleUpdate);
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      if (data.reminders) {
        setReminders(data.reminders);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date) return;

    try {
      if (isEditing) {
        const res = await fetch('/api/reminders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: isEditing, ...formData })
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to create');
      }
      await fetchReminders();
      setIsEditing(null);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save reminder:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengingat ini?')) return;
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchReminders();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      const res = await fetch('/api/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchReminders();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const startEdit = (reminder: Reminder) => {
    setFormData(reminder);
    setIsEditing(reminder.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      amount: null,
      status: 'PENDING',
      priority: 'MEDIUM',
      frequency: 'ONCE',
      urgent: false
    });
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredReminders = reminders.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesPriority = filterPriority === 'ALL' || r.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'LOW': return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      default: return 'text-zinc-400 bg-zinc-800/50 border-zinc-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari pengingat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 pl-9 pr-4 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'PENDING' | 'COMPLETED')}
              className="bg-[#1A1A1A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Selesai</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH')}
              className="bg-[#1A1A1A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="HIGH">Tinggi</option>
              <option value="MEDIUM">Sedang</option>
              <option value="LOW">Rendah</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsEditing(null); setIsModalOpen(true); }}
          className="shrink-0 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors w-full md:w-auto shadow-[0_0_15px_rgba(45,212,191,0.2)]"
        >
          <Plus className="w-4 h-4" /> Tambah Baru
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#141414] border border-[#262626] rounded-xl text-center">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Bell className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm">Memuat pengingat...</p>
        </div>
      ) : filteredReminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredReminders.map((reminder) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={reminder.id}
                className={`group relative flex flex-col p-5 rounded-xl border transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] hover:-translate-y-1 ${reminder.status === 'COMPLETED' ? 'bg-[#141414]/50 border-zinc-800/50 opacity-60 hover:opacity-100' : 'bg-[#1A1A1A] border-[#262626] hover:border-zinc-700'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStatus(reminder.id, reminder.status)}
                      className={`shrink-0 transition-colors ${reminder.status === 'COMPLETED' ? 'text-teal-500' : 'text-zinc-500 hover:text-teal-400'}`}
                    >
                      {reminder.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex flex-col">
                      <h4 className={`font-bold text-base ${reminder.status === 'COMPLETED' ? 'text-zinc-500 line-through' : 'text-white'}`}>
                        {reminder.title}
                      </h4>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateLabel(reminder.date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-end justify-between">
                  <div className="flex flex-col gap-2">
                    {reminder.amount != null && (
                      <span className="text-sm font-semibold text-zinc-300">
                        {formatCurrency(reminder.amount)}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1 w-fit ${getPriorityColor(reminder.priority)}`}>
                        <AlertCircle className="w-3 h-3" />
                        {reminder.priority}
                      </div>
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-zinc-700 bg-zinc-800/50 text-zinc-400 flex items-center gap-1 w-fit">
                        <RefreshCw className="w-3 h-3" />
                        {reminder.frequency}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(reminder)} className="p-2 text-zinc-400 hover:text-teal-400 rounded-lg hover:bg-zinc-800 bg-zinc-900 shadow-sm border border-zinc-800"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(reminder.id)} className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 bg-zinc-900 shadow-sm border border-zinc-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {reminder.status === 'PENDING' && reminder.priority === 'HIGH' && new Date(reminder.date) < new Date() && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 rounded-r-xl opacity-80 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[#141414] border border-[#262626] rounded-xl text-center">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Tidak ada pengingat</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-6">Mulai tambahkan tagihan atau pengingat penting agar keuangan Anda tetap teratur.</p>
          <button
            onClick={() => { resetForm(); setIsEditing(null); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Pengingat Pertama
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#141414] border border-[#262626] rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-5 border-b border-zinc-800/80">
                <h3 className="font-bold text-lg text-white">
                  {isEditing ? 'Edit Pengingat' : 'Tambah Pengingat Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama / Judul</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tagihan Listrik"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tanggal</label>
                    <input
                      type="date"
                      value={formData.date?.split('T')[0] || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nominal</label>
                    <input
                      type="text"
                      placeholder="Rp..."
                      value={formData.amount != null ? String(formData.amount) : ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        const formattedVal = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setFormData({ ...formData, amount: val ? parseInt(val) : undefined });
                      }}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prioritas</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as Reminder['priority'] })}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm outline-none focus:border-teal-500"
                    >
                      <option value="LOW">Rendah</option>
                      <option value="MEDIUM">Sedang</option>
                      <option value="HIGH">Tinggi</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Frekuensi</label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData({ ...formData, frequency: e.target.value as Reminder['frequency'] })}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm outline-none focus:border-teal-500"
                    >
                      <option value="ONCE">Sekali</option>
                      <option value="DAILY">Harian</option>
                      <option value="WEEKLY">Mingguan</option>
                      <option value="MONTHLY">Bulanan</option>
                      <option value="YEARLY">Tahunan</option>
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as Reminder['status'] })}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm outline-none focus:border-teal-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Selesai</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-zinc-800/80 bg-[#1A1A1A] flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-700"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.title || !formData.date}
                  className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                >
                  Simpan Pengingat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}