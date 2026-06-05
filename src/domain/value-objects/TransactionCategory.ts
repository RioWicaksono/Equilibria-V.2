// Transaction Categories - Ubiquitous Language
export interface TransactionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
  isDefault: boolean;
}

export const DEFAULT_EXPENSE_CATEGORIES: TransactionCategory[] = [
  { id: 'food', name: 'Makanan & Minuman', icon: '🍔', color: '#f97316', type: 'EXPENSE', isDefault: true },
  { id: 'transport', name: 'Transportasi', icon: '🚗', color: '#3b82f6', type: 'EXPENSE', isDefault: true },
  { id: 'shopping', name: 'Belanja', icon: '🛒', color: '#ec4899', type: 'EXPENSE', isDefault: true },
  { id: 'entertainment', name: 'Hiburan', icon: '🎬', color: '#8b5cf6', type: 'EXPENSE', isDefault: true },
  { id: 'bills', name: 'Tagihan & Utilitas', icon: '📄', color: '#ef4444', type: 'EXPENSE', isDefault: true },
  { id: 'health', name: 'Kesehatan', icon: '💊', color: '#22c55e', type: 'EXPENSE', isDefault: true },
  { id: 'education', name: 'Pendidikan', icon: '📚', color: '#06b6d4', type: 'EXPENSE', isDefault: true },
  { id: 'investment', name: 'Investasi', icon: '📈', color: '#14b8a6', type: 'EXPENSE', isDefault: true },
  { id: 'savings', name: 'Tabungan', icon: '💰', color: '#eab308', type: 'EXPENSE', isDefault: true },
  { id: 'other_expense', name: 'Lainnya', icon: '📦', color: '#6b7280', type: 'EXPENSE', isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: TransactionCategory[] = [
  { id: 'salary', name: 'Gaji', icon: '💵', color: '#22c55e', type: 'INCOME', isDefault: true },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3b82f6', type: 'INCOME', isDefault: true },
  { id: 'business', name: 'Bisnis', icon: '🏪', color: '#8b5cf6', type: 'INCOME', isDefault: true },
  { id: 'investment_income', name: 'Hasil Investasi', icon: '📈', color: '#14b8a6', type: 'INCOME', isDefault: true },
  { id: 'gift', name: 'Hadiah', icon: '🎁', color: '#ec4899', type: 'INCOME', isDefault: true },
  { id: 'refund', name: 'Refund', icon: '↩️', color: '#06b6d4', type: 'INCOME', isDefault: true },
  { id: 'other_income', name: 'Lainnya', icon: '💰', color: '#6b7280', type: 'INCOME', isDefault: true },
];

export const ALL_DEFAULT_CATEGORIES = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

export function getCategoryById(id: string): TransactionCategory | undefined {
  return ALL_DEFAULT_CATEGORIES.find(c => c.id === id);
}

export function getCategoriesByType(type: 'INCOME' | 'EXPENSE'): TransactionCategory[] {
  return type === 'INCOME' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
}