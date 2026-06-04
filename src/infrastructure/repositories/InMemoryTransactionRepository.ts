import { Transaction } from '../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../domain/repositories/ITransactionRepository';
import { TransactionType } from '../../domain/value-objects/TransactionType';

const globalForStore = globalThis as unknown as {
  _transactionsStore: Transaction[] | undefined;
};

const defaultData: Transaction[] = [
  {
    id: '1',
    amount: 15000000,
    type: 'INCOME' as TransactionType,
    category: 'Gaji Utama',
    date: new Date(),
    description: 'Tech Company Inc.',
    createdAt: new Date(),
  },
  {
    id: '2',
    amount: 150000,
    type: 'EXPENSE' as TransactionType,
    category: 'Makan',
    date: new Date(),
    description: 'Makan Siang',
    createdAt: new Date(),
  },
];

const store: Transaction[] = globalForStore._transactionsStore ?? defaultData;
if (process.env.NODE_ENV !== 'production') globalForStore._transactionsStore = store;

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
    return [...store].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findById(id: string): Promise<Transaction | null> {
    return store.find((t) => t.id === id) || null;
  }

  async findByFilter(filter: TransactionFilter): Promise<Transaction[]> {
    return store.filter((t) => {
      if (filter.type && t.type !== filter.type) return false;
      if (filter.category && t.category !== filter.category) return false;
      if (filter.startDate && t.date < filter.startDate) return false;
      if (filter.endDate && t.date > filter.endDate) return false;
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