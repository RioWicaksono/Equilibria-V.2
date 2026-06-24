// Recurring Auto-Creation Service
// Automatically creates transactions when recurring schedules are due

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDate: string;
  description?: string;
  lastCreated?: string;
}

interface AutoCreatedTransaction {
  id: string;
  recurringId: string;
  recurringName: string;
  amount: number;
  date: string;
  createdAt: string;
}

class RecurringAutoCreationService {
  private storageKey = 'equilibria_auto_created';
  private listeners: Array<(transactions: AutoCreatedTransaction[]) => void> = [];
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize listener
    if (typeof window !== 'undefined') {
      this.loadAndProcess();
    }
  }

  loadAndProcess(): void {
    if (typeof window === 'undefined') return;

    // Clear existing timers
    this.stopTimers();

    // Wait for app to be ready
    this.timeoutId = setTimeout(() => {
      this.processDueRecurring();
    }, 2000);

    // Check every hour
    this.intervalId = setInterval(() => {
      this.processDueRecurring();
    }, 60 * 60 * 1000);
  }

  // Cleanup method to stop timers
  stopTimers(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  processDueRecurring(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('equilibria_recurring');
    if (!stored) return;

    const recurring: RecurringItem[] = JSON.parse(stored);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get already created transactions for today
    const autoCreated = this.getAutoCreatedTransactions();
    const todayCreated = autoCreated.filter(t => t.date === todayStr);
    const createdIds = new Set(todayCreated.map(t => t.recurringId));

    const newCreated: AutoCreatedTransaction[] = [];

    recurring.forEach(item => {
      // Skip if already created today
      if (createdIds.has(item.id)) return;

      const nextDate = new Date(item.nextDate);

      // Check if due today or past due
      if (nextDate <= today) {
        // Auto-create transaction
        const transaction = this.createTransactionFromRecurring(item, todayStr);
        newCreated.push(transaction);

        // Update recurring next date
        this.updateNextDate(item, today);
      }
    });

    if (newCreated.length > 0) {
      // Save auto-created transactions
      const allCreated = [...autoCreated, ...newCreated];
      localStorage.setItem(this.storageKey, JSON.stringify(allCreated));

      // Also save to main transactions
      this.saveToTransactions(newCreated);

      // Notify listeners
      this.notifyListeners(newCreated);

      // Send notification
      this.sendAutoCreationNotification(newCreated);
    }
  }

  createTransactionFromRecurring(item: RecurringItem, date: string): AutoCreatedTransaction {
    return {
      id: `auto-${Date.now()}-${item.id}`,
      recurringId: item.id,
      recurringName: item.name,
      amount: item.amount,
      date: date,
      createdAt: new Date().toISOString()
    };
  }

  updateNextDate(item: RecurringItem, currentDate: Date): void {
    const recurring = JSON.parse(localStorage.getItem('equilibria_recurring') || '[]');
    const frequencyMap: Record<string, (date: Date) => Date> = {
      'Harian': (d) => new Date(d.getTime() + 24 * 60 * 60 * 1000),
      'Mingguan': (d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000),
      'Bulanan': (d) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      'Tahunan': (d) => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
    };

    const nextDateFn = frequencyMap[item.frequency] || frequencyMap['Bulanan'];
    const newNextDate = nextDateFn(currentDate);

    const updated = recurring.map((r: RecurringItem) => {
      if (r.id === item.id) {
        return { ...r, nextDate: newNextDate.toISOString().split('T')[0] };
      }
      return r;
    });

    localStorage.setItem('equilibria_recurring', JSON.stringify(updated));
  }

  saveToTransactions(autoCreated: AutoCreatedTransaction[]): void {
    const transactions = JSON.parse(localStorage.getItem('equilibria_transactions') || '[]');

    autoCreated.forEach(created => {
      const newTransaction = {
        id: created.id,
        type: 'EXPENSE',
        amount: created.amount,
        category: 'recurring',
        description: `Auto: ${created.recurringName}`,
        date: created.date,
        createdAt: created.createdAt,
        isAutoCreated: true
      };
      transactions.push(newTransaction);
    });

    localStorage.setItem('equilibria_transactions', JSON.stringify(transactions));

    // Dispatch event for UI update
    window.dispatchEvent(new CustomEvent('transactions-updated'));
  }

  sendAutoCreationNotification(created: AutoCreatedTransaction[]): void {
    if (typeof window === 'undefined') return;

    const totalAmount = created.reduce((sum, t) => sum + t.amount, 0);
    const formatted = new Intl.NumberFormat('id-ID').format(totalAmount);

    // Simple notification using browser API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📅 Transaksi Otomatis Dibuat', {
        body: `${created.length} transaksi otomatis dibuat total Rp ${formatted}`,
        icon: '/icon.svg',
        tag: 'auto-recurring'
      });
    }
  }

  getAutoCreatedTransactions(): AutoCreatedTransaction[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  getTodayCreated(): AutoCreatedTransaction[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getAutoCreatedTransactions().filter(t => t.date === today);
  }

  addListener(callback: (transactions: AutoCreatedTransaction[]) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (transactions: AutoCreatedTransaction[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(created: AutoCreatedTransaction[]): void {
    this.listeners.forEach(callback => callback(created));
  }
}

export const recurringAutoService = new RecurringAutoCreationService();