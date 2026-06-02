import { Transaction } from '../models/Transaction';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findAll(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  delete(id: string): Promise<void>;
}
