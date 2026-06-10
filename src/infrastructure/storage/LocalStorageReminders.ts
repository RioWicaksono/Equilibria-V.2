export interface Reminder {
  id: string;
  title: string;
  date: string;
  amount: string;
  status: 'PENDING' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  urgent: boolean;
}

export function getReminders(): Reminder[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('equilibria_reminders');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((p: Reminder) => ({
        ...p,
        status: p.status || 'PENDING',
        priority: p.priority || (p.urgent ? 'HIGH' : 'MEDIUM'),
        frequency: p.frequency || 'ONCE'
      }));
    } catch {
      return [];
    }
  }
  return [
    { id: '1', title: 'Bayar Listrik', date: new Date(new Date().setDate(5)).toISOString(), amount: '500000', urgent: true, status: 'PENDING', priority: 'HIGH', frequency: 'MONTHLY' },
    { id: '2', title: 'Tagihan Internet', date: new Date(new Date().setDate(10)).toISOString(), amount: '350000', urgent: false, status: 'PENDING', priority: 'MEDIUM', frequency: 'MONTHLY' },
    { id: '3', title: 'Iuran Warga', date: new Date(new Date().setDate(15)).toISOString(), amount: '50000', urgent: false, status: 'PENDING', priority: 'LOW', frequency: 'MONTHLY' },
  ];
}

export function saveReminders(reminders: Reminder[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('equilibria_reminders', JSON.stringify(reminders));
    window.dispatchEvent(new Event('reminders-updated'));
  }
}