export type DebtType = 'DEBT' | 'LOAN';
export type DebtStatus = 'UNPAID' | 'PAID';

export const DebtTypeValues = ['DEBT', 'LOAN'] as const;
export const DebtStatusValues = ['UNPAID', 'PAID'] as const;

export function isValidDebtType(value: string): value is DebtType {
  return DebtTypeValues.includes(value as DebtType);
}

export function isValidDebtStatus(value: string): value is DebtStatus {
  return DebtStatusValues.includes(value as DebtStatus);
}