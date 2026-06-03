import { Transaction, TransactionType } from '../../domain/models/Transaction';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { InMemoryTransactionRepository } from '../../infrastructure/repositories/InMemoryTransactionRepository';
import { PrismaTransactionRepository } from '../../infrastructure/repositories/PrismaTransactionRepository';
import { v4 as uuidv4 } from 'uuid';

// Abstract Factory pattern logic: 
// Jika user sudah setup DATABASE_URL di Railway, sistem akan load Prisma DB.
// Karena kita sedang di mode AI Studio Preview, kita gunakan InMemory sebagai default.
export interface Budget {
  id: string;
  category: string;
  limit: number;
}

const getRepository = (): ITransactionRepository => {
  const dbUrl = process.env.DATABASE_URL;
  // Use Prisma only if DATABASE_URL is set, starts with postgres, and doesn't contain Railway template strings
  if (dbUrl && dbUrl.startsWith('postgres') && !dbUrl.includes('${{')) {
    return new PrismaTransactionRepository();
  }
  return new InMemoryTransactionRepository();
};

const repository = getRepository();

export class FinanceService {
  static async addTransaction(
    amount: number,
    type: TransactionType,
    category: string,
    description: string,
    dateString: string
  ): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      amount,
      type,
      category,
      description,
      date: new Date(dateString),
      createdAt: new Date(),
    };
    
    await repository.save(transaction);
    return transaction;
  }

  static async getTransactions(): Promise<Transaction[]> {
    return repository.findAll();
  }

  static async updateTransaction(
    id: string,
    amount: number,
    type: TransactionType,
    category: string,
    description: string,
    dateString: string
  ): Promise<Transaction | null> {
    const existing = await repository.findById(id);
    if (!existing) return null;

    const updated: Transaction = {
      ...existing,
      amount,
      type,
      category,
      description,
      date: new Date(dateString),
    };
    
    await repository.save(updated);
    return updated;
  }

  static async getSummary() {
    const transactions = await repository.findAll();
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }

  static async deleteTransaction(id: string): Promise<void> {
    await repository.delete(id);
  }

  // Budgets implementation (In-memory array for simplicity in this context)
  private static budgets: Budget[] = [];

  static async getBudgets(): Promise<Budget[]> {
    return this.budgets;
  }

  static async setBudget(category: string, limit: number): Promise<Budget> {
    const existingIndex = this.budgets.findIndex(b => b.category === category);
    if (existingIndex >= 0) {
      this.budgets[existingIndex].limit = limit;
      return this.budgets[existingIndex];
    }
    const newBudget: Budget = { id: uuidv4(), category, limit };
    this.budgets.push(newBudget);
    return newBudget;
  }
}
