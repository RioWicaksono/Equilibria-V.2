export type TransactionType = 'INCOME' | 'EXPENSE';

export const TransactionTypeValues = ['INCOME', 'EXPENSE'] as const;

export function isValidTransactionType(value: string): value is TransactionType {
  return TransactionTypeValues.includes(value as TransactionType);
}