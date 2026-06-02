export interface Reminder {
  id: string;
  title: string;
  date: string;
  amount: string;
  urgent: boolean;
}

export function getReminders(): Reminder[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('equilibria_reminders');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [
    { id: '1', title: 'Bayar Listrik', date: new Date(new Date().setDate(5)).toISOString(), amount: 'Rp 500.000', urgent: true },
    { id: '2', title: 'Tagihan Internet', date: new Date(new Date().setDate(10)).toISOString(), amount: 'Rp 350.000', urgent: false },
    { id: '3', title: 'Iuran Warga', date: new Date(new Date().setDate(15)).toISOString(), amount: 'Rp 50.000', urgent: false },
  ];
}

export function saveReminders(reminders: Reminder[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('equilibria_reminders', JSON.stringify(reminders));
    window.dispatchEvent(new Event('reminders-updated'));
  }
}
