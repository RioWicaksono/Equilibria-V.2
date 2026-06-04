export type Money = {
  amount: number;
  currency: string;
};

export function createMoney(amount: number, currency: string = 'IDR'): Money {
  return { amount, currency };
}

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: money.currency,
  }).format(money.amount);
}