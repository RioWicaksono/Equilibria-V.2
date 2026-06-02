import { Transaction } from '../../domain/models/Transaction';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';

// Gunakan global object untuk mencegah data hilang saat Next.js HMR reloads di development
const globalForStore = globalThis as unknown as {
  _transactionsStore: Transaction[] | undefined;
};

const defaultData: Transaction[] = [
  {
    id: '1',
    amount: 15000000,
    type: 'INCOME',
    category: 'Gaji Utama',
    date: new Date(),
    description: 'Tech Company Inc.',
    createdAt: new Date(),
  },
  {
    id: '2',
    amount: 150000,
    type: 'EXPENSE',
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

  async delete(id: string): Promise<void> {
    const index = store.findIndex((t) => t.id === id);
    if (index >= 0) {
      store.splice(index, 1);
    }
  }
}
