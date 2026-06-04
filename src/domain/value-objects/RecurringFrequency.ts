export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const RecurringFrequencyValues = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

export function isValidFrequency(value: string): value is RecurringFrequency {
  return RecurringFrequencyValues.includes(value as RecurringFrequency);
}