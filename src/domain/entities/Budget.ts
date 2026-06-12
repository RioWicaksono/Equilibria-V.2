export interface Budget {
  id: string;
  category: string;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetUsage {
  id: string;
  transactionId: string;
  budgetId: string;
  amountUsed: number;
  createdAt: Date;
}

export interface CreateBudgetInput {
  category: string;
  limit: number;
  id?: string;
}

export function createBudget(input: CreateBudgetInput): Budget {
  if (!input.category || input.category.trim() === '') {
    throw new Error('Category is required');
  }
  if (!input.limit || input.limit <= 0) {
    throw new Error('Budget limit must be greater than 0');
  }

  const now = new Date();
  return {
    id: input.id || generateBudgetId(),
    category: input.category.trim(),
    limit: input.limit,
    createdAt: now,
    updatedAt: now,
  };
}

export function isOverBudget(budget: Budget, spent: number): boolean {
  return spent > budget.limit;
}

export function getBudgetPercentage(budget: Budget, spent: number): number {
  if (budget.limit === 0) return 0;
  const percentage = (spent / budget.limit) * 100;
  return Math.min(100, Math.max(0, percentage));
}

export function getRemainingAmount(budget: Budget, spent: number): number {
  return budget.limit - spent;
}

function generateBudgetId(): string {
  return `budget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}