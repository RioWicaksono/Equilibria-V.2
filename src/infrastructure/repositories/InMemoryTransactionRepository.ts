import { Transaction } from '../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter, FinancialSummaryResult } from '../../domain/repositories/ITransactionRepository';
import { TransactionType } from '../../domain/value-objects/TransactionType';

const globalForStore = globalThis as unknown as {
  _transactionsStore: Transaction[] | undefined;
};

const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

// Sample data - HANYA untuk development, TIDAK untuk production
const developmentSampleData: Transaction[] = isDevelopment ? [
  {
    id: 'sample-1',
    amount: 15000000,
    type: 'INCOME' as TransactionType,
    category: 'Gaji Utama',
    date: new Date().toISOString(),
    description: 'Tech Company Inc. - Sample Data (Development Only)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    amount: 150000,
    type: 'EXPENSE' as TransactionType,
    category: 'Makan',
    date: new Date().toISOString(),
    description: 'Makan Siang - Sample Data (Development Only)',
    createdAt: new Date().toISOString(),
  },
] : [];

const store: Transaction[] = globalForStore._transactionsStore ?? developmentSampleData;
if (process.env?.NODE_ENV !== 'production') globalForStore._transactionsStore = store;

export class InMemoryTransactionRepository implements ITransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    const index = store.findIndex((t) => t.id === transaction.id);
    if (index >= 0) {
      store[index] = transaction;
    } else {
      store.push(transaction);
    }
  }

  async findAll(): Promise<Transaction[]> {
    return [...store].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getFinancialSummary(): Promise<FinancialSummaryResult> {
    const transactions = store;
    const summary = transactions.reduce(
      (acc, t) => {
        if (t.type === 'INCOME') {
          acc.totalIncome += t.amount;
        } else {
          acc.totalExpense += t.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    return {
      ...summary,
      balance: summary.totalIncome - summary.totalExpense,
      transactionCount: transactions.length,
    };
  }

  async findById(id: string): Promise<Transaction | null> {
    return store.find((t) => t.id === id) || null;
  }

  async findByFilter(filter: TransactionFilter): Promise<Transaction[]> {
    return store.filter((t) => {
      if (filter.type && t.type !== filter.type) return false;
      if (filter.category && t.category !== filter.category) return false;
      if (filter.startDate && t.date < (filter.startDate instanceof Date ? filter.startDate.toISOString() : filter.startDate)) return false;
      if (filter.endDate && t.date > (filter.endDate instanceof Date ? filter.endDate.toISOString() : filter.endDate)) return false;
      return true;
    });
  }

  async delete(id: string): Promise<void> {
    const index = store.findIndex((t) => t.id === id);
    if (index >= 0) {
      store.splice(index, 1);
    }
  }
}
