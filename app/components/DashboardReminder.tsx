'use client';

import { Bell, Edit2, Trash2, Plus, X } from 'lucide-react';
import { Reminder, getReminders, saveReminders } from '@/lib/reminders';
import { useState, useEffect } from 'react';

export default function DashboardReminder() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    urgent: false
  });

  useEffect(() => {
    const handleUpdate = () => {
      setReminders(getReminders());
    }
    handleUpdate();
    window.addEventListener('reminders-updated', handleUpdate);
    return () => {
      window.removeEventListener('reminders-updated', handleUpdate);
    };
  }, []);

  const handleSave = () => {
    if (!formData.title || !formData.date) return;
    
    let updated;
    if (isEditing) {
      updated = reminders.map(r => r.id === isEditing ? { ...r, ...formData } as Reminder : r);
    } else {
      updated = [...reminders, { ...formData, id: crypto.randomUUID() } as Reminder];
    }
    
    saveReminders(updated);
    setReminders(updated);
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ title: '', date: new Date().toISOString().split('T')[0], amount: '', urgent: false });
  };

  const handleDelete = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    saveReminders(updated);
    setReminders(updated);
  };

  const startEdit = (reminder: Reminder) => {
    setFormData(reminder);
    setIsEditing(reminder.id);
    setIsAdding(false);
  };

  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return `Tgl ${d.getDate()}`;
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-bold text-white">Pengingat Tagihan</h3>
      </div>
      
      <div className="space-y-4 flex-1">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className="group flex flex-col p-3 rounded-lg border border-zinc-800/50 bg-[#1A1A1A] hover:bg-[#202020] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                  {reminder.title}
                  {reminder.urgent && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Segera</span>
                  )}
                </span>
                <span className="text-xs text-zinc-500">Jatuh tempo: {formatDateLabel(reminder.date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-300">
                  {reminder.amount}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(reminder)} className="p-1.5 text-zinc-400 hover:text-teal-400 rounded-md hover:bg-zinc-800"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(reminder.id)} className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-zinc-800"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {(isAdding || isEditing) && (
          <div className="p-4 rounded-lg border border-teal-500/30 bg-teal-500/5 space-y-3 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-white">{isEditing ? 'Edit Pengingat' : 'Tambah Pengingat'}</h4>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
            </div>
            <input 
              type="text" placeholder="Nama Tagihan" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded text-sm p-2 focus:border-teal-500 outline-none"
            />
            <div className="flex gap-2">
               <input 
                 type="date" 
                 value={formData.date?.split('T')[0]} onChange={e => setFormData({...formData, date: e.target.value})}
                 className="flex-1 bg-[#1A1A1A] border border-[#262626] text-white rounded text-sm p-2 focus:border-teal-500 outline-none"
               />
               <input 
                 type="text" placeholder="Nominal (opsional)" 
                 value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                 className="flex-1 bg-[#1A1A1A] border border-[#262626] text-white rounded text-sm p-2 focus:border-teal-500 outline-none"
               />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={formData.urgent} onChange={e => setFormData({...formData, urgent: e.target.checked})} className="rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-teal-500" />
              Tandai Penting
            </label>
            <button onClick={handleSave} className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded">
              Simpan
            </button>
          </div>
        )}
      </div>
      
      {!isAdding && !isEditing && (
        <button onClick={() => { setIsAdding(true); setFormData({ title: '', date: new Date().toISOString().split('T')[0], amount: '', urgent: false }); }} className="w-full mt-6 py-2.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Pengingat
        </button>
      )}
    </div>
  );
}
