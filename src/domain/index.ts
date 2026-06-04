// Domain barrel exports - use direct imports instead for better tree-shaking
// Example: import { Transaction } from '@/domain/entities/Transaction';
// Instead of: import { Transaction } from '@/domain';

export * from './entities/Transaction';
export * from './entities/Budget';
export * from './entities/Wallet';
export * from './entities/Debt';
export * from './entities/FinancialGoal';
export * from './entities/RecurringTransaction';
export * from './value-objects/TransactionType';
export * from './value-objects/Money';
export * from './value-objects/Amount';
export * from './value-objects/DebtType';
export * from './value-objects/RecurringFrequency';
export * from './events/DomainEvents';