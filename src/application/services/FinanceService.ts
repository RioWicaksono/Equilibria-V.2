import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { Transaction } from '../../domain/entities/Transaction';
import { Budget } from '../../domain/entities/Budget';
import { TransactionType } from '../../domain/value-objects/TransactionType';

// Factory function for repository selection
export type RepositoryFactory = () => {
  transaction: ITransactionRepository;
  budget: IBudgetRepository;
};

// Default factory - checks env for database URL
const defaultFactory: RepositoryFactory = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;
  const usePrisma = dbUrl && dbUrl.startsWith('postgres') && !dbUrl.includes('${{');

  if (usePrisma) {
    const { PrismaTransactionRepository } = require('../../infrastructure/repositories/PrismaTransactionRepository');
    const { PrismaBudgetRepository } = require('../../infrastructure/repositories/PrismaBudgetRepository');
    return {
      transaction: new PrismaTransactionRepository(),
      budget: new PrismaBudgetRepository(),
    };
  }

  const { InMemoryTransactionRepository } = require('../../infrastructure/repositories/InMemoryTransactionRepository');
  return {
    transaction: new InMemoryTransactionRepository(),
    budget: new InMemoryTransactionRepositoryBudget(),
  };
};

// In-memory budget implementation for development
class InMemoryTransactionRepositoryBudget implements IBudgetRepository {
  private budgets: Budget[] = [];

  async save(budget: Budget): Promise<void> {
    const index = this.budgets.findIndex((b) => b.id === budget.id || b.category === budget.category);
    if (index >= 0) {
      this.budgets[index] = budget;
    } else {
      this.budgets.push(budget);
    }
  }

  async findAll(): Promise<Budget[]> {
    return [...this.budgets];
  }

  async findById(id: string): Promise<Budget | null> {
    return this.budgets.find((b) => b.id === id) || null;
  }

  async findByCategory(category: string): Promise<Budget | null> {
    return this.budgets.find((b) => b.category === category) || null;
  }

  async delete(id: string): Promise<void> {
    this.budgets = this.budgets.filter((b) => b.id !== id);
  }
}

// Lazy load use cases
function createTransactionUseCases(repo: ITransactionRepository) {
  const { TransactionUseCases } = require('../use-cases/TransactionUseCases');
  return new TransactionUseCases(repo);
}

function createBudgetUseCases(budgetRepo: IBudgetRepository, transactionRepo: ITransactionRepository) {
  const { BudgetUseCases } = require('../use-cases/BudgetUseCases');
  return new BudgetUseCases(budgetRepo, transactionRepo);
}

export class FinanceService {
  private readonly repositories: ReturnType<RepositoryFactory>;
  private _transactionUseCases: any = null;
  private _budgetUseCases: any = null;

  constructor(repositoryFactory: RepositoryFactory = defaultFactory) {
    this.repositories = repositoryFactory();
  }

  private get transactionUseCases() {
    if (!this._transactionUseCases) {
      this._transactionUseCases = createTransactionUseCases(this.repositories.transaction);
    }
    return this._transactionUseCases;
  }

  private get budgetUseCases() {
    if (!this._budgetUseCases) {
      this._budgetUseCases = createBudgetUseCases(this.repositories.budget, this.repositories.transaction);
    }
    return this._budgetUseCases;
  }

  async addTransaction(
    amount: number,
    type: TransactionType,
    category: string,
    description: string,
    dateString: string
  ): Promise<Transaction> {
    return this.transactionUseCases.createTransaction({
      amount,
      type,
      category,
      description,
      date: new Date(dateString),
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.transactionUseCases.getAllTransactions();
  }

  async updateTransaction(
    id: string,
    amount: number,
    type: TransactionType,
    category: string,
    description: string,
    dateString: string
  ): Promise<Transaction | null> {
    return this.transactionUseCases.updateTransaction({
      id,
      amount,
      type,
      category,
      description,
      date: new Date(dateString),
    });
  }

  async getSummary() {
    return this.transactionUseCases.getFinancialSummary();
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.transactionUseCases.deleteTransaction(id);
  }

  async getBudgets(): Promise<Budget[]> {
    return this.budgetUseCases.getAllBudgets();
  }

  async getBudgetStatuses() {
    return this.budgetUseCases.getAllBudgetStatuses();
  }

  async setBudget(category: string, limit: number): Promise<Budget> {
    return this.budgetUseCases.createBudget({ category, limit });
  }

  async getBudgetStatus(budgetId: string) {
    return this.budgetUseCases.getBudgetStatus(budgetId);
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.budgetUseCases.deleteBudget(id);
  }
}

// Singleton instance
let serviceInstance: FinanceService | null = null;

export const getFinanceService = (): FinanceService => {
  if (!serviceInstance) {
    serviceInstance = new FinanceService();
  }
  return serviceInstance;
};

// Backward compatibility exports
export const financeService = {
  addTransaction: (amount: number, type: TransactionType, category: string, description: string, date: string) =>
    getFinanceService().addTransaction(amount, type, category, description, date),
  getTransactions: () => getFinanceService().getTransactions(),
  updateTransaction: (id: string, amount: number, type: TransactionType, category: string, description: string, date: string) =>
    getFinanceService().updateTransaction(id, amount, type, category, description, date),
  getSummary: () => getFinanceService().getSummary(),
  deleteTransaction: (id: string) => getFinanceService().deleteTransaction(id),
  getBudgets: () => getFinanceService().getBudgets(),
  getBudgetStatuses: () => getFinanceService().getBudgetStatuses(),
  setBudget: (category: string, limit: number) => getFinanceService().setBudget(category, limit),
  getBudgetStatus: (id: string) => getFinanceService().getBudgetStatus(id),
  deleteBudget: (id: string) => getFinanceService().deleteBudget(id),
};