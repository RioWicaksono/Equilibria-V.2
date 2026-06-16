// Repository exports
export { InMemoryTransactionRepository } from './InMemoryTransactionRepository';
export { PrismaTransactionRepository } from './PrismaTransactionRepository';
export { PrismaBudgetRepository } from './PrismaBudgetRepository';
export { PrismaWalletRepository } from './PrismaWalletRepository';
export { PrismaDebtRepository } from './PrismaDebtRepository';
export { PrismaFinancialGoalRepository } from './PrismaFinancialGoalRepository';
export { PrismaRecurringTransactionRepository } from './PrismaRecurringTransactionRepository';

// Repository interfaces re-exports
export type { ITransactionRepository, TransactionFilter } from '@/domain/repositories/ITransactionRepository';
export type { IBudgetRepository } from '@/domain/repositories/IBudgetRepository';
export type { IWalletRepository } from './PrismaWalletRepository';
export type { IDebtRepository } from './PrismaDebtRepository';
export type { IFinancialGoalRepository } from './PrismaFinancialGoalRepository';
export type { IRecurringTransactionRepository } from './PrismaRecurringTransactionRepository';

// Factory function
import { PrismaTransactionRepository } from './PrismaTransactionRepository';
import { PrismaBudgetRepository } from './PrismaBudgetRepository';
import { PrismaWalletRepository } from './PrismaWalletRepository';
import { PrismaDebtRepository } from './PrismaDebtRepository';
import { PrismaFinancialGoalRepository } from './PrismaFinancialGoalRepository';
import { PrismaRecurringTransactionRepository } from './PrismaRecurringTransactionRepository';
import type { ITransactionRepository } from '@/domain/repositories/ITransactionRepository';
import type { IBudgetRepository } from '@/domain/repositories/IBudgetRepository';
import type { IWalletRepository } from './PrismaWalletRepository';
import type { IDebtRepository } from './PrismaDebtRepository';
import type { IFinancialGoalRepository } from './PrismaFinancialGoalRepository';
import type { IRecurringTransactionRepository } from './PrismaRecurringTransactionRepository';

export interface RepositoryFactory {
  transaction: ITransactionRepository;
  budget: IBudgetRepository;
  wallet: IWalletRepository;
  debt: IDebtRepository;
  goal: IFinancialGoalRepository;
  recurring: IRecurringTransactionRepository;
}

// Singleton instance
let repositoryInstance: RepositoryFactory | null = null;

export const getRepositories = (): RepositoryFactory => {
  if (!repositoryInstance) {
    repositoryInstance = {
      transaction: new PrismaTransactionRepository(),
      budget: new PrismaBudgetRepository(),
      wallet: new PrismaWalletRepository(),
      debt: new PrismaDebtRepository(),
      goal: new PrismaFinancialGoalRepository(),
      recurring: new PrismaRecurringTransactionRepository(),
    };
  }
  return repositoryInstance;
};