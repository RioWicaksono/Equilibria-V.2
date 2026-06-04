import { Transaction } from '../entities/Transaction';
import { TransactionType } from '../value-objects/TransactionType';

export interface TransactionFilter {
  type?: TransactionType;
  category?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findAll(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  findByFilter(filter: TransactionFilter): Promise<Transaction[]>;
  delete(id: string): Promise<void>;
}