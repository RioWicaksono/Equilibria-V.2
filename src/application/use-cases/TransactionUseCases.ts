import { Transaction } from '../../domain/entities/Transaction';
import { TransactionType, isValidTransactionType } from '../../domain/value-objects/TransactionType';
import { ITransactionRepository, TransactionFilter } from '../../domain/repositories/ITransactionRepository';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTransactionDTO {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: Date;
}

export interface UpdateTransactionDTO {
  id: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
  description?: string;
  date?: Date;
}

export class TransactionUseCases {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async createTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      amount: dto.amount,
      type: dto.type,
      category: dto.category,
      description: dto.description,
      date: dto.date,
      createdAt: new Date(),
    };

    await this.transactionRepository.save(transaction);
    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findById(id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.findAll();
  }

  async getTransactionsByFilter(filter: TransactionFilter): Promise<Transaction[]> {
    return this.transactionRepository.findByFilter(filter);
  }

  async updateTransaction(dto: UpdateTransactionDTO): Promise<Transaction | null> {
    const existing = await this.transactionRepository.findById(dto.id);
    if (!existing) return null;

    const updated: Transaction = {
      ...existing,
      amount: dto.amount ?? existing.amount,
      type: dto.type ?? existing.type,
      category: dto.category ?? existing.category,
      description: dto.description ?? existing.description,
      date: dto.date ?? existing.date,
    };

    await this.transactionRepository.save(updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const existing = await this.transactionRepository.findById(id);
    if (!existing) return false;

    await this.transactionRepository.delete(id);
    return true;
  }

  async getFinancialSummary(): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  }> {
    const transactions = await this.transactionRepository.findAll();

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
}