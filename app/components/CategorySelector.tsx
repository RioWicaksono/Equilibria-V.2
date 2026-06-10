'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { getCategoriesByType } from '@/domain/value-objects/TransactionCategory';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  type: 'INCOME' | 'EXPENSE';
}

export default function CategorySelector({ value, onChange, type }: CategorySelectorProps) {
  const [search, setSearch] = useState('');
  const categories = getCategoriesByType(type);
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCategory = categories.find(c => c.id === value);

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
            <span className="text-sm">{selectedCategory.name}</span>
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
                <span className="text-xs truncate">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}