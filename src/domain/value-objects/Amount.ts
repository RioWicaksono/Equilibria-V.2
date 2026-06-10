export interface TransactionId {
  readonly value: string;
}

export interface Amount {
  readonly value: number;
  readonly currency: string;
}

export function createAmount(value: number, currency: string = 'IDR'): Amount {
  if (value < 0) {
    throw new Error('Amount cannot be negative');
  }
  return { value, currency };
}

export function formatAmount(amount: Amount): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: amount.currency,
  }).format(amount.value);
}