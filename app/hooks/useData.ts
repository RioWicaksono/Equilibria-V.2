'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Transaction } from '@/domain/entities/Transaction';
import type { Budget } from '@/domain/entities/Budget';

// Fetch functions
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

// Transactions hooks
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
      if (!res.ok) throw new Error('Failed to create transaction');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      router.refresh();
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      router.refresh();
    },
  });
}

// Budgets hooks
export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () =>
      fetchJSON<{ budgets: Budget[] }>('/api/budgets').then((data) => data.budgets),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Budget) => {
      return fetchJSON('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

// Wallets hooks
export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: () =>
      fetchJSON<{ wallets: unknown[] }>('/api/wallets').then((data) => data.wallets),
  });
}

// Goals hooks
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () =>
      fetchJSON<{ goals: unknown[] }>('/api/goals').then((data) => data.goals),
  });
}

// Debts hooks
export function useDebts() {
  return useQuery({
    queryKey: ['debts'],
    queryFn: () =>
      fetchJSON<{ debts: unknown[] }>('/api/debts').then((data) => data.debts),
  });
}

// Summary hook
export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: () => fetchJSON<{ balance: number; totalIncome: number; totalExpense: number }>('/api/summary'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => fetchJSON<{ status: string }>('/api/health'),
    refetchInterval: 60 * 1000, // Check every minute
  });
}