import { Budget } from '../../domain/entities/Budget';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from '../../domain/value-objects/TransactionType';

export interface CreateBudgetDTO {
  category: string;
  limit: number;
}

export interface UpdateBudgetDTO {
  id: string;
  limit?: number;
  category?: string;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isExceeded: boolean;
}

export class BudgetUseCases {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async createBudget(dto: CreateBudgetDTO): Promise<Budget> {
    const existing = await this.budgetRepository.findByCategory(dto.category);
    if (existing) {
      existing.limit = dto.limit;
      await this.budgetRepository.save(existing);
      return existing;
    }

    const budget: Budget = {
      id: uuidv4(),
      category: dto.category,
      limit: dto.limit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.budgetRepository.save(budget);
    return budget;
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    return this.budgetRepository.findById(id);
  }

  async getAllBudgets(): Promise<Budget[]> {
    return this.budgetRepository.findAll();
  }

  async updateBudget(dto: UpdateBudgetDTO): Promise<Budget | null> {
    const existing = await this.budgetRepository.findById(dto.id);
    if (!existing) return null;

    const updated: Budget = {
      ...existing,
      limit: dto.limit ?? existing.limit,
      category: dto.category ?? existing.category,
      updatedAt: new Date(),
    };

    await this.budgetRepository.save(updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const existing = await this.budgetRepository.findById(id);
    if (!existing) return false;

    await this.budgetRepository.delete(id);
    return true;
  }

  async getBudgetStatus(budgetId: string): Promise<BudgetStatus | null> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) return null;

    const transactions = await this.transactionRepository.findByFilter({
      category: budget.category,
      type: 'EXPENSE' as TransactionType,
    });

    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, budget.limit - spent);
    const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

    return {
      budget,
      spent,
      remaining,
      percentUsed,
      isExceeded: spent > budget.limit,
    };
  }

  async getAllBudgetStatuses(): Promise<BudgetStatus[]> {
    const budgets = await this.budgetRepository.findAll();
    const statuses: BudgetStatus[] = [];

    for (const budget of budgets) {
      const status = await this.getBudgetStatus(budget.id);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }
}