import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { Transaction } from '../../domain/entities/Transaction';
import { Budget } from '../../domain/entities/Budget';
import { TransactionType } from '../../domain/value-objects/TransactionType';
import { InMemoryTransactionRepository } from '../../infrastructure/repositories/InMemoryTransactionRepository';

// Factory function for repository selection
export type RepositoryFactory = () => {
  transaction: ITransactionRepository;
  budget: IBudgetRepository;
};

// Default factory - uses in-memory repositories for simplicity
const defaultFactory: RepositoryFactory = () => {
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
async function createTransactionUseCases(repo: ITransactionRepository) {
  const { TransactionUseCases } = await import('../use-cases/TransactionUseCases');
  return new TransactionUseCases(repo);
}

async function createBudgetUseCases(budgetRepo: IBudgetRepository, transactionRepo: ITransactionRepository) {
  const { BudgetUseCases } = await import('../use-cases/BudgetUseCases');
  return new BudgetUseCases(budgetRepo, transactionRepo);
}

export class FinanceService {
  private readonly repositories: ReturnType<RepositoryFactory>;
  private _transactionUseCases: Promise<unknown> | null = null;
  private _budgetUseCases: Promise<unknown> | null = null;

  constructor(repositoryFactory: RepositoryFactory = defaultFactory) {
    this.repositories = repositoryFactory();
  }

  private getTransactionUseCases(): Promise<unknown> {
    if (!this._transactionUseCases) {
      this._transactionUseCases = createTransactionUseCases(this.repositories.transaction);
    }
    return this._transactionUseCases;
  }

  private getBudgetUseCases(): Promise<unknown> {
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
    const useCases = await this.getTransactionUseCases() as { createTransaction: (data: unknown) => Promise<Transaction> };
    return useCases.createTransaction({
      amount,
      type,
      category,
      description,
      date: new Date(dateString),
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    const useCases = await this.getTransactionUseCases() as { getAllTransactions: () => Promise<Transaction[]> };
    return useCases.getAllTransactions();
  }

  async updateTransaction(
    id: string,
    amount: number,
    type: TransactionType,
    category: string,
    description: string,
    dateString: string
  ): Promise<Transaction | null> {
    const useCases = await this.getTransactionUseCases() as { updateTransaction: (data: unknown) => Promise<Transaction | null> };
    return useCases.updateTransaction({
      id,
      amount,
      type,
      category,
      description,
      date: new Date(dateString),
    });
  }

  async getSummary() {
    const useCases = await this.getTransactionUseCases() as { getFinancialSummary: () => unknown };
    return useCases.getFinancialSummary();
  }

  async deleteTransaction(id: string): Promise<void> {
    const useCases = await this.getTransactionUseCases() as { deleteTransaction: (id: string) => Promise<void> };
    await useCases.deleteTransaction(id);
  }

  async getBudgets(): Promise<Budget[]> {
    const useCases = await this.getBudgetUseCases() as { getAllBudgets: () => Promise<Budget[]> };
    return useCases.getAllBudgets();
  }

  async getBudgetStatuses() {
    const useCases = await this.getBudgetUseCases() as { getAllBudgetStatuses: () => unknown };
    return useCases.getAllBudgetStatuses();
  }

  async setBudget(category: string, limit: number): Promise<Budget> {
    const useCases = await this.getBudgetUseCases() as { createBudget: (data: { category: string; limit: number }) => Promise<Budget> };
    return useCases.createBudget({ category, limit });
  }

  async getBudgetStatus(budgetId: string) {
    const useCases = await this.getBudgetUseCases() as { getBudgetStatus: (id: string) => unknown };
    return useCases.getBudgetStatus(budgetId);
  }

  async deleteBudget(id: string): Promise<boolean> {
    const useCases = await this.getBudgetUseCases() as { deleteBudget: (id: string) => Promise<boolean> };
    return useCases.deleteBudget(id);
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
