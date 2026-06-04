import { Budget } from '../entities/Budget';

export interface IBudgetRepository {
  save(budget: Budget): Promise<void>;
  findAll(): Promise<Budget[]>;
  findById(id: string): Promise<Budget | null>;
  findByCategory(category: string): Promise<Budget | null>;
  delete(id: string): Promise<void>;
}