-- Migration: add_performance_indexes
-- Created: 2026-06-16
-- Description: Add database indexes for performance optimization

-- Transaction table indexes
CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction" ("date");
CREATE INDEX IF NOT EXISTS "Transaction_category_idx" ON "Transaction" ("category");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction" ("type");
CREATE INDEX IF NOT EXISTS "Transaction_walletId_idx" ON "Transaction" ("walletId");
CREATE INDEX IF NOT EXISTS "Transaction_date_category_idx" ON "Transaction" ("date", "category");
CREATE INDEX IF NOT EXISTS "Transaction_date_type_idx" ON "Transaction" ("date", "type");

-- Budget table indexes
CREATE INDEX IF NOT EXISTS "Budget_category_idx" ON "Budget" ("category");

-- BudgetUsage table indexes
CREATE INDEX IF NOT EXISTS "BudgetUsage_transactionId_idx" ON "BudgetUsage" ("transactionId");
CREATE INDEX IF NOT EXISTS "BudgetUsage_budgetId_idx" ON "BudgetUsage" ("budgetId");

-- Wallet table indexes
CREATE INDEX IF NOT EXISTS "Wallet_balance_idx" ON "Wallet" ("balance");

-- FinancialGoal table indexes
CREATE INDEX IF NOT EXISTS "FinancialGoal_deadline_idx" ON "FinancialGoal" ("deadline");

-- Debt table indexes
CREATE INDEX IF NOT EXISTS "Debt_status_idx" ON "Debt" ("status");
CREATE INDEX IF NOT EXISTS "Debt_type_idx" ON "Debt" ("type");
CREATE INDEX IF NOT EXISTS "Debt_dueDate_idx" ON "Debt" ("dueDate");

-- RecurringTransaction table indexes
CREATE INDEX IF NOT EXISTS "RecurringTransaction_nextDate_idx" ON "RecurringTransaction" ("nextDate");
CREATE INDEX IF NOT EXISTS "RecurringTransaction_frequency_idx" ON "RecurringTransaction" ("frequency");