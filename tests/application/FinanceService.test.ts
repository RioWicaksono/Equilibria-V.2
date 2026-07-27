import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceService } from '@/application/services/FinanceService';
import type { ITransactionRepository } from '@/domain/repositories/ITransactionRepository';
import type { IBudgetRepository } from '@/domain/repositories/IBudgetRepository';
import type { Transaction } from '@/domain/entities/Transaction';
import type { Budget } from '@/domain/entities/Budget';
import { TransactionType } from '@/domain/value-objects/TransactionType';

// ============================================
// MOCK FACTORIES (Arrange)
// ============================================

function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    amount: 100000,
    type: TransactionType.EXPENSE,
    category: 'Makanan',
    description: 'Test transaction',
    date: new Date('2026-06-10'),
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'budget-1',
    category: 'Makanan',
    limit: 2000000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockTransactionRepo(overrides: Partial<ITransactionRepository> = {}): ITransactionRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByWallet: vi.fn().mockResolvedValue([]),
    findByDateRange: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(createMockTransaction()),
    update: vi.fn().mockResolvedValue(createMockTransaction()),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockBudgetRepo(overrides: Partial<IBudgetRepository> = {}): IBudgetRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByCategory: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(createMockBudget()),
    update: vi.fn().mockResolvedValue(createMockBudget()),
    delete: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function createMockRepositoryFactory(
  transactionRepo: ITransactionRepository,
  budgetRepo: IBudgetRepository
) {
  return vi.fn(() => ({
    transaction: transactionRepo,
    budget: budgetRepo,
  }));
}

// ============================================
// TEST SUITE: FinanceService - Transactions
// ============================================

describe('FinanceService', () => {
  describe('Transaction Operations', () => {
    // ========================================
    // ARRANGE: Setup mocks for each test
    // ========================================
    let mockTransactionRepo: ITransactionRepository;
    let mockBudgetRepo: IBudgetRepository;
    let repositoryFactory: ReturnType<typeof createMockRepositoryFactory>;
    let service: FinanceService;

    beforeEach(() => {
      mockTransactionRepo = createMockTransactionRepo();
      mockBudgetRepo = createMockBudgetRepo();
      repositoryFactory = createMockRepositoryFactory(mockTransactionRepo, mockBudgetRepo);
      service = new FinanceService(repositoryFactory);
    });

    // ========================================
    // ACT & ASSERT: Test behaviors
    // ========================================

    describe('getTransactions', () => {
      it('should return all transactions from repository', async () => {
        // Arrange
        const mockTransactions = [
          createMockTransaction({ id: 'tx-1', amount: 100000 }),
          createMockTransaction({ id: 'tx-2', amount: 200000 }),
        ];
        mockTransactionRepo.findAll = vi.fn().mockResolvedValue(mockTransactions);

        // Act
        const result = await service.getTransactions();

        // Assert
        expect(result).toEqual(mockTransactions);
        expect(mockTransactionRepo.findAll).toHaveBeenCalledTimes(1);
      });

      it('should return empty array when no transactions exist', async () => {
        // Arrange
        mockTransactionRepo.findAll = vi.fn().mockResolvedValue([]);

        // Act
        const result = await service.getTransactions();

        // Assert
        expect(result).toEqual([]);
        expect(mockTransactionRepo.findAll).toHaveBeenCalledTimes(1);
      });

      it('should call repository with correct parameters', async () => {
        // Arrange - no additional setup needed

        // Act
        await service.getTransactions();

        // Assert
        expect(mockTransactionRepo.findAll).toHaveBeenCalled();
      });
    });

    describe('addTransaction', () => {
      it('should create transaction with valid data', async () => {
        // Arrange
        const inputData = {
          amount: 150000,
          type: TransactionType.EXPENSE,
          category: 'Makanan',
          description: 'Makan siang',
          date: '2026-06-10',
        };
        const expectedTransaction = createMockTransaction({ amount: inputData.amount });
        mockTransactionRepo.create = vi.fn().mockResolvedValue(expectedTransaction);

        // Act
        const result = await service.addTransaction(
          inputData.amount,
          inputData.type,
          inputData.category,
          inputData.description,
          inputData.date
        );

        // Assert
        expect(result.amount).toBe(inputData.amount);
        expect(mockTransactionRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: inputData.amount,
            type: inputData.type,
            category: inputData.category,
          })
        );
      });

      it('should convert date string to Date object', async () => {
        // Arrange
        const dateString = '2026-06-10';
        const expectedDate = new Date(dateString);
        mockTransactionRepo.create = vi.fn().mockResolvedValue(createMockTransaction());

        // Act
        await service.addTransaction(100000, TransactionType.EXPENSE, 'Test', 'Desc', dateString);

        // Assert
        expect(mockTransactionRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            date: expect.any(Date),
          })
        );
      });

      it('should propagate repository errors', async () => {
        // Arrange
        mockTransactionRepo.create = vi.fn().mockRejectedValue(new Error('DB Error'));

        // Act & Assert
        await expect(
          service.addTransaction(100000, TransactionType.EXPENSE, 'Test', 'Desc', '2026-06-10')
        ).rejects.toThrow('DB Error');
      });
    });

    describe('updateTransaction', () => {
      it('should update transaction with valid data', async () => {
        // Arrange
        const txId = 'tx-1';
        const updatedTransaction = createMockTransaction({ id: txId, amount: 200000 });
        mockTransactionRepo.update = vi.fn().mockResolvedValue(updatedTransaction);

        // Act
        const result = await service.updateTransaction(
          txId,
          200000,
          TransactionType.EXPENSE,
          'Makanan',
          'Updated desc',
          '2026-06-10'
        );

        // Assert
        expect(result?.amount).toBe(200000);
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(
          txId,
          expect.objectContaining({ amount: 200000 })
        );
      });

      it('should return null when transaction not found', async () => {
        // Arrange
        mockTransactionRepo.update = vi.fn().mockResolvedValue(null);

        // Act
        const result = await service.updateTransaction(
          'non-existent-id',
          100000,
          TransactionType.EXPENSE,
          'Test',
          'Desc',
          '2026-06-10'
        );

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('deleteTransaction', () => {
      it('should delete transaction by id', async () => {
        // Arrange
        const txId = 'tx-1';
        mockTransactionRepo.delete = vi.fn().mockResolvedValue(undefined);

        // Act
        await service.deleteTransaction(txId);

        // Assert
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith(txId);
      });

      it('should propagate repository errors', async () => {
        // Arrange
        mockTransactionRepo.delete = vi.fn().mockRejectedValue(new Error('Delete failed'));

        // Act & Assert
        await expect(service.deleteTransaction('tx-1')).rejects.toThrow('Delete failed');
      });
    });
  });

  // ============================================
  // TEST SUITE: FinanceService - Budgets
  // ============================================

  describe('Budget Operations', () => {
    let mockTransactionRepo: ITransactionRepository;
    let mockBudgetRepo: IBudgetRepository;
    let service: FinanceService;

    beforeEach(() => {
      mockTransactionRepo = createMockTransactionRepo();
      mockBudgetRepo = createMockBudgetRepo();
      service = new FinanceService(() => ({
        transaction: mockTransactionRepo,
        budget: mockBudgetRepo,
      }));
    });

    describe('getBudgets', () => {
      it('should return all budgets', async () => {
        // Arrange
        const mockBudgets = [
          createMockBudget({ id: 'b-1', category: 'Makanan' }),
          createMockBudget({ id: 'b-2', category: 'Transport' }),
        ];
        mockBudgetRepo.findAll = vi.fn().mockResolvedValue(mockBudgets);

        // Act
        const result = await service.getBudgets();

        // Assert
        expect(result).toEqual(mockBudgets);
        expect(mockBudgetRepo.findAll).toHaveBeenCalledTimes(1);
      });
    });

    describe('setBudget', () => {
      it('should create budget with category and limit', async () => {
        // Arrange
        const category = 'Entertainment';
        const limit = 500000;
        const createdBudget = createMockBudget({ category, limit });
        mockBudgetRepo.create = vi.fn().mockResolvedValue(createdBudget);

        // Act
        const result = await service.setBudget(category, limit);

        // Assert
        expect(result.category).toBe(category);
        expect(result.limit).toBe(limit);
        expect(mockBudgetRepo.create).toHaveBeenCalledWith({ category, limit });
      });
    });

    describe('updateBudget', () => {
      it('should update budget with partial data', async () => {
        // Arrange
        const budgetId = 'budget-1';
        const updateData = { limit: 3000000 };
        const updatedBudget = createMockBudget({ id: budgetId, ...updateData });
        mockBudgetRepo.update = vi.fn().mockResolvedValue(updatedBudget);

        // Act
        const result = await service.updateBudget(budgetId, updateData);

        // Assert
        expect(result?.limit).toBe(3000000);
        expect(mockBudgetRepo.update).toHaveBeenCalledWith(budgetId, updateData);
      });

      it('should return null when budget not found', async () => {
        // Arrange
        mockBudgetRepo.update = vi.fn().mockResolvedValue(null);

        // Act
        const result = await service.updateBudget('non-existent', { limit: 1000000 });

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('deleteBudget', () => {
      it('should delete budget and return true on success', async () => {
        // Arrange
        const budgetId = 'budget-1';
        mockBudgetRepo.delete = vi.fn().mockResolvedValue(true);

        // Act
        const result = await service.deleteBudget(budgetId);

        // Assert
        expect(result).toBe(true);
        expect(mockBudgetRepo.delete).toHaveBeenCalledWith(budgetId);
      });

      it('should return false when budget not found', async () => {
        // Arrange
        mockBudgetRepo.delete = vi.fn().mockResolvedValue(false);

        // Act
        const result = await service.deleteBudget('non-existent');

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});

// ============================================
// TEST SUITE: Repository Integration
// ============================================

describe('Repository Integration', () => {
  it('should use correct repository for each operation', async () => {
    // Arrange
    const mockTransactionRepo = createMockTransactionRepo();
    const mockBudgetRepo = createMockBudgetRepo();
    const service = new FinanceService(() => ({
      transaction: mockTransactionRepo,
      budget: mockBudgetRepo,
    }));

    // Act - Transaction operations
    await service.getTransactions();
    await service.addTransaction(100, TransactionType.EXPENSE, 'Test', 'Desc', '2026-01-01');

    // Act - Budget operations
    await service.getBudgets();
    await service.setBudget('Test', 1000);

    // Assert - Verify correct repositories were called
    expect(mockTransactionRepo.findAll).toHaveBeenCalled();
    expect(mockTransactionRepo.create).toHaveBeenCalled();
    expect(mockBudgetRepo.findAll).toHaveBeenCalled();
    expect(mockBudgetRepo.create).toHaveBeenCalled();
  });

  it('should handle concurrent operations correctly', async () => {
    // Arrange
    const mockTransactionRepo = createMockTransactionRepo();
    const mockBudgetRepo = createMockBudgetRepo();
    const service = new FinanceService(() => ({
      transaction: mockTransactionRepo,
      budget: mockBudgetRepo,
    }));

    // Act - Concurrent operations
    const [transactions, budgets] = await Promise.all([
      service.getTransactions(),
      service.getBudgets(),
    ]);

    // Assert - Both should complete successfully
    expect(Array.isArray(transactions)).toBe(true);
    expect(Array.isArray(budgets)).toBe(true);
  });
});
