export interface Debt {
  id: string;
  name: string;
  amount: number;
  type: 'DEBT' | 'LOAN';
  status: 'UNPAID' | 'PAID';
  dueDate?: Date;
  createdAt: Date;
}