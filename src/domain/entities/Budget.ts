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