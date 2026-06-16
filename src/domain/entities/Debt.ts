export interface Debt {
  id: string;
  name: string;
  amount: number;
  paidAmount: number;
  type: 'DEBT' | 'LOAN';
  status: 'UNPAID' | 'PAID';
  description?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}