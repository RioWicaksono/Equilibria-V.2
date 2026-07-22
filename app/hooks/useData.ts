'use client';

import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Transaction } from '@/domain/entities/Transaction';
import type { Budget } from '@/domain/entities/Budget';

// ============================================
// RETRY CONFIGURATION
// ============================================
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attemptIndex: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attemptIndex);
  const jitter = exponentialDelay * 0.1 * Math.random();
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
}

// ============================================
// API CLIENT WITH RETRY
// ============================================
interface ApiError extends Error {
  status?: number;
  isRetryable?: boolean;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error: ApiError = new Error(`HTTP error! status: ${res.status}`);
    error.status = res.status;
    error.isRetryable = res.status >= 500 || res.status === 429;
    throw error;
  }

  return res.json();
}

// ============================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================
interface OptimisticUpdate<T> {
  optimisticData: T;
  rollbackData?: T;
}

/**
 * Create optimistic transaction for adding
 */
function createOptimisticTransaction(data: Partial<Transaction>): Transaction {
  return {
    id: `temp_${Date.now()}`,
    amount: data.amount || 0,
    type: data.type || 'EXPENSE',
    category: data.category || '',
    description: data.description || '',
    date: data.date ? new Date(data.date) : new Date(),
    createdAt: new Date(),
    walletId: data.walletId,
  };
}

// ============================================
// TRANSACTIONS HOOKS
// ============================================
export function useTransactions(filters?: {
  date?: string;
  category?: string;
  type?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.date) params.set('date', filters.date);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.type) params.set('type', filters.type);

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () =>
      fetchJSON<{ transactions: Transaction[] }>(
        `/api/transactions?${params.toString()}`
      ).then((data) => data.transactions),
    retry: RETRY_CONFIG.maxRetries,
    retryDelay: getRetryDelay,
    staleTime: 30 * 1000,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        body: data,
      });
      if (!res.ok) {
        const error: ApiError = new Error('Failed to create transaction');
        error.status = res.status;
        error.isRetryable = res.status >= 500;
        throw error;
      }
      return res.json();
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(['transactions']);

      const optimisticTransaction = createOptimisticTransaction({
        amount: parseFloat(formData.get('amount') as string),
        type: formData.get('type') as 'INCOME' | 'EXPENSE',
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
      });

      queryClient.setQueryData<Transaction[]>(
        ['transactions'],
        (old = []) => [optimisticTransaction, ...old]
      );

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      router.refresh();
    },
    retry: 1,
    retryDelay: getRetryDelay,
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        body: data,
      });
      if (!res.ok) {
        const error: ApiError = new Error('Failed to update transaction');
        error.status = res.status;
        error.isRetryable = res.status >= 500;
        throw error;
      }
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(['transactions']);

      const updatedAmount = parseFloat(data.get('amount') as string);
      const updatedType = data.get('type') as 'INCOME' | 'EXPENSE';
      const updatedCategory = data.get('category') as string;
      const updatedDescription = data.get('description') as string;
      const updatedDate = data.get('date') as string;

      queryClient.setQueryData<Transaction[]>(
        ['transactions'],
        (old = []) =>
          old.map((t) =>
            t.id === id
              ? {
                  ...t,
                  amount: updatedAmount || t.amount,
                  type: updatedType || t.type,
                  category: updatedCategory || t.category,
                  description: updatedDescription ?? t.description,
                  date: updatedDate ? new Date(updatedDate) : t.date,
                }
              : t
          )
      );

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      router.refresh();
    },
    retry: 1,
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error: ApiError = new Error('Failed to delete transaction');
        error.status = res.status;
        error.isRetryable = res.status >= 500;
        throw error;
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(['transactions']);

      queryClient.setQueryData<Transaction[]>(
        ['transactions'],
        (old = []) => old.filter((t) => t.id !== id)
      );

      return { previousTransactions };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      router.refresh();
    },
    retry: 1,
  });
}

// ============================================
// BUDGETS HOOKS
// ============================================
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () =>
      fetchJSON<{ budgets: Budget[] }>('/api/budgets').then((data) => data.budgets),
    retry: RETRY_CONFIG.maxRetries,
    retryDelay: getRetryDelay,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Budget) => {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create budget');
      return res.json();
    },
    onMutate: async (newBudget) => {
      await queryClient.cancelQueries({ queryKey: ['budgets'] });

      const previousBudgets = queryClient.getQueryData<Budget[]>(['budgets']);

      const optimisticBudget: Budget = {
        ...newBudget,
        id: `temp_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<Budget[]>(
        ['budgets'],
        (old = []) => [...old, optimisticBudget]
      );

      return { previousBudgets };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousBudgets) {
        queryClient.setQueryData(['budgets'], context.previousBudgets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    retry: 1,
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['budgets'] });

      const previousBudgets = queryClient.getQueryData<Budget[]>(['budgets']);

      queryClient.setQueryData<Budget[]>(
        ['budgets'],
        (old = []) => old.filter((b) => b.id !== id)
      );

      return { previousBudgets };
    },
    onError: (_err, _id, context) => {
      if (context?.previousBudgets) {
        queryClient.setQueryData(['budgets'], context.previousBudgets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    retry: 1,
  });
}

// ============================================
// WALLETS HOOKS
// ============================================
export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: () =>
      fetchJSON<{ wallets: unknown[] }>('/api/wallets').then((data) => data.wallets),
    retry: RETRY_CONFIG.maxRetries,
    retryDelay: getRetryDelay,
  });
}

// ============================================
// GOALS HOOKS
// ============================================
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () =>
      fetchJSON<{ goals: unknown[] }>('/api/goals').then((data) => data.goals),
    retry: RETRY_CONFIG.maxRetries,
    retryDelay: getRetryDelay,
  });
}

// ============================================
// DEBTS HOOKS
// ============================================
export function useDebts() {
  return useQuery({
    queryKey: ['debts'],
    queryFn: () =>
      fetchJSON<{ debts: unknown[] }>('/api/debts').then((data) => data.debts),
    retry: RETRY_CONFIG.maxRetries,
    retryDelay: getRetryDelay,
  });
}

// ============================================
// SUMMARY HOOK
// ============================================
export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: () =>
      fetchJSON<{
        balance: number;
        totalIncome: number;
        totalExpense: number;
      }>('/api/summary'),
    staleTime: 30 * 1000,
    retry: RETRY_CONFIG.maxRetries,
    retryDelay: getRetryDelay,
  });
}

// ============================================
// HEALTH CHECK HOOK
// ============================================
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => fetchJSON<{ status: string }>('/api/health'),
    refetchInterval: 60 * 1000,
    retry: 2,
    retryDelay: getRetryDelay,
  });
}

// ============================================
// RE-EXPORT TYPES
// ============================================
export type { OptimisticUpdate };
