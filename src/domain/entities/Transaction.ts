import { TransactionType } from '../value-objects/TransactionType';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  date: Date;
  description: string;
  createdAt: Date;
}