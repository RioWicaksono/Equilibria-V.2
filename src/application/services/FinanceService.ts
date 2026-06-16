import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { Transaction } from '../../domain/entities/Transaction';
import { Budget } from '../../domain/entities/Budget';
import { TransactionType } from '../../domain/value-objects/TransactionType';
import { getRepositories } from '../../infrastructure/repositories';

// Factory function for repository selection
export type RepositoryFactory = () => {
  transaction: ITransactionRepository;
  budget: IBudgetRepository;
};

// Default factory - uses Prisma repositories for database persistence
const defaultFactory: RepositoryFactory = () => {
  const repos = getRepositories();
  return {
    transaction: repos.transaction,
    budget: repos.budget,
  };
};

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

  async updateBudget(id: string, data: { category?: string; limit?: number }): Promise<Budget | null> {
    const useCases = await this.getBudgetUseCases() as { updateBudget: (id: string, data: { category?: string; limit?: number }) => Promise<Budget | null> };
    return useCases.updateBudget(id, data);
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
  updateBudget: (id: string, data: { category?: string; limit?: number }) =>
    getFinanceService().updateBudget(id, data) as unknown,
  getBudgetStatus: (id: string) => getFinanceService().getBudgetStatus(id),
  deleteBudget: (id: string) => getFinanceService().deleteBudget(id),
};