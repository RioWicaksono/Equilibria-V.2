'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Edit3 } from 'lucide-react';
import { getCategoriesByType, TransactionCategory } from '@/domain/value-objects/TransactionCategory';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  type: 'INCOME' | 'EXPENSE';
}

export default function CategorySelector({ value, onChange, type }: CategorySelectorProps) {
  const [search, setSearch] = useState('');
  const [customCategories, setCustomCategories] = useState<TransactionCategory[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');

  // Load custom categories from API
  useEffect(() => {
    const loadCustomCategories = async () => {
      try {
        const res = await fetch(`/api/categories?type=${type}`);
        const data = await res.json();
        if (data.categories) {
          setCustomCategories(data.categories.map((c: { id: string; name: string; icon: string; color: string; type: string }) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            type: c.type,
            isDefault: false
          })));
        }
      } catch (e) {
        console.error('Failed to load custom categories', e);
      }
    };
    loadCustomCategories();
  }, [type]);

  // Combine default and custom categories
  const allCategories = [
    ...getCategoriesByType(type),
    ...customCategories.filter(c => {
      const defaultIds = getCategoriesByType(type).map(dc => dc.id);
      return !defaultIds.includes(c.id);
    })
  ];

  const filteredCategories = allCategories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCategory = allCategories.find(c => c.id === value);

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;

    const newCategory = {
      name: newCategoryName.trim(),
      icon: newCategoryIcon || '📁',
      color: '#6b7280',
      type: type,
    };

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();

      if (data.category) {
        const created: TransactionCategory = {
          id: data.category.id,
          name: data.category.name,
          icon: data.category.icon,
          color: data.category.color,
          type: data.category.type,
          isDefault: false
        };

        const updated = [...customCategories, created];
        setCustomCategories(updated);

        // Select the new category
        onChange(created.id);
      }
    } catch (e) {
      console.error('Failed to save custom category', e);
    }

    setNewCategoryName('');
    setNewCategoryIcon('📁');
    setIsAddingCustom(false);
    setSearch('');
    document.getElementById('category-dropdown')?.classList.add('hidden');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400 mb-1">Kategori</label>

      {/* Selected Category Display */}
      <div
        className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-3 flex items-center gap-2 cursor-pointer hover:border-teal-500/50 transition-colors"
        onClick={() => document.getElementById('category-dropdown')?.classList.toggle('hidden')}
      >
        {selectedCategory ? (
          <>
            <span className="text-lg">{selectedCategory.icon}</span>
            <span className="text-sm flex-1">{selectedCategory.name}</span>
            {selectedCategory.id.startsWith('custom_') && (
              <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Custom</span>
            )}
          </>
        ) : (
          <span className="text-sm text-zinc-500">Pilih kategori...</span>
        )}
      </div>

      {/* Category Dropdown */}
      <div id="category-dropdown" className="hidden bg-[#1A1A1A] border border-[#262626] rounded-lg overflow-hidden shadow-xl">
        {/* Search */}
        <div className="p-2 border-b border-[#262626]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Add Custom Category Button */}
        <div className="p-2 border-b border-[#262626]">
          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg text-xs font-medium transition-colors border border-dashed border-teal-500/30"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori Baru
          </button>
        </div>

        {/* Add Custom Category Form */}
        <AnimatePresence>
          {isAddingCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 bg-teal-500/5 border-b border-teal-500/20"
            >
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama kategori baru"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Icon (emoji)"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-16 bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2 text-center text-lg focus:outline-none focus:border-teal-500"
                    maxLength={2}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-700 text-black font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setNewCategoryName('');
                      setNewCategoryIcon('📁');
                    }}
                    className="px-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Grid */}
        <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-1">
            {filteredCategories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setSearch('');
                  document.getElementById('category-dropdown')?.classList.add('hidden');
                }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                  value === category.id
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'hover:bg-zinc-800 text-white'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="text-xs truncate flex-1">{category.name}</span>
                {category.id.startsWith('custom_') && (
                  <Edit3 className="w-3 h-3 text-teal-400/50" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Icons for Custom Category */}
        <div className="p-2 border-t border-[#262626]">
          <p className="text-[10px] text-zinc-500 mb-2">Icon untuk kategori baru:</p>
          <div className="flex flex-wrap gap-1">
            {['💰', '🛒', '🍔', '🚗', '🏠', '💊', '📱', '✈️', '🎮', '👕', '🎓', '🎁'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setNewCategoryIcon(emoji)}
                className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-zinc-800 transition-colors ${
                  newCategoryIcon === emoji ? 'bg-teal-500/20 border border-teal-500/30' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}