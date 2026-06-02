export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description: string;
  createdAt: Date;
}
