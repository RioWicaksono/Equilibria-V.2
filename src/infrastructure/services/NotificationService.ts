// Notification Service - Handles push notifications and reminders
import { getReminders, type Reminder } from '../storage/LocalStorageReminders';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private listeners: Map<string, (notification: NotificationPayload) => void> = new Map();

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  sendNotification(payload: NotificationPayload): void {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon.svg',
      tag: payload.tag || 'equilibria-notification',
      badge: '/icon.svg',
      requireInteraction: true,
      data: payload.data
    };

    // @ts-ignore - vibrate is not in standard types but supported
    const notification = new Notification(payload.title, options);

    // Notify listeners
    this.listeners.forEach((callback) => {
      callback(payload);
    });

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    notification.onclick = () => {
      window.focus();
      notification.close();

      // Navigate based on data
      if (payload.data?.redirect) {
        window.location.href = payload.data.redirect;
      }
    };
  }

  // Check and send reminders due today
  checkReminders(): void {
    const reminders = getReminders();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hour = now.getHours();

    // Only send notifications during reasonable hours (8 AM - 9 PM)
    if (hour < 8 || hour > 21) return;

    reminders.forEach(reminder => {
      const reminderDate = reminder.date.split('T')[0];

      // Check if reminder is today and pending
      if (reminderDate === today && reminder.status === 'PENDING') {
        // Check if already notified today
        const notifiedKey = `equilibria_notified_${reminder.id}_${today}`;
        if (localStorage.getItem(notifiedKey)) return;

        const priorityLabel = {
          HIGH: '🔴 Penting',
          MEDIUM: '🟡 Sedang',
          LOW: '🟢 Rendah'
        };

        this.sendNotification({
          title: `💰 Reminder: ${reminder.title}`,
          body: `Rp ${parseInt(reminder.amount || '0').toLocaleString('id-ID')} - ${priorityLabel[reminder.priority]}`,
          tag: `reminder-${reminder.id}`,
          data: {
            type: 'reminder',
            reminderId: reminder.id,
            redirect: '/reminders'
          }
        });

        // Mark as notified
        localStorage.setItem(notifiedKey, 'true');
      }
    });
  }

  // Check recurring transactions due today
  checkRecurringDue(): void {
    if (typeof window === 'undefined') return;

    const recurring = JSON.parse(localStorage.getItem('equilibria_recurring') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hour = now.getHours();

    // Only check during reasonable hours
    if (hour < 8 || hour > 21) return;

    recurring.forEach((item: any) => {
      if (item.nextDate === today) {
        const notifiedKey = `equilibria_recurring_notified_${item.id}_${today}`;
        if (localStorage.getItem(notifiedKey)) return;

        this.sendNotification({
          title: `📅 Transaksi Otomatis: ${item.name}`,
          body: `Rp ${item.amount.toLocaleString('id-ID')} - ${item.frequency}`,
          tag: `recurring-${item.id}`,
          data: {
            type: 'recurring',
            recurringId: item.id,
            redirect: '/recurring'
          }
        });

        localStorage.setItem(notifiedKey, 'true');
      }
    });
  }

  // Check debts with due dates
  checkDebtsDue(): void {
    if (typeof window === 'undefined') return;

    const debts = JSON.parse(localStorage.getItem('equilibria_debts') || '[]');
    const today = new Date();
    const daysUntil = 3; // Notify 3 days before due
    const now = new Date();
    const hour = now.getHours();

    if (hour < 8 || hour > 21) return;

    debts.forEach((debt: any) => {
      if (!debt.dueDate || debt.status === 'PAID') return;

      const dueDate = new Date(debt.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= daysUntil && diffDays >= 0) {
        const notifiedKey = `equilibria_debt_notified_${debt.id}`;
        if (localStorage.getItem(notifiedKey)) return;

        const remaining = debt.amount - (debt.paidAmount || 0);
        const isDebt = debt.type === 'DEBT';

        this.sendNotification({
          title: isDebt ? `⚠️ Hutang Jatuh Tempo` : `💵 Piutang Jatuh Tempo`,
          body: `${debt.name}: Rp ${remaining.toLocaleString('id-ID')} - ${diffDays === 0 ? 'Hari ini!' : `${diffDays} hari lagi`}`,
          tag: `debt-${debt.id}`,
          data: {
            type: 'debt',
            debtId: debt.id,
            redirect: '/debts'
          }
        });

        localStorage.setItem(notifiedKey, 'true');
      }
    });
  }

  // Schedule daily check at 9 AM
  scheduleDailyReminderCheck(): void {
    if (typeof window === 'undefined') return;

    // Check immediately if it's around 9 AM
    const now = new Date();
    const hour = now.getHours();

    // Initial check (can be removed in production)
    setTimeout(() => {
      this.checkReminders();
      this.checkRecurringDue();
      this.checkDebtsDue();
    }, 5000);

    // Schedule next check in 1 hour
    setInterval(() => {
      this.checkReminders();
      this.checkRecurringDue();
      this.checkDebtsDue();
    }, 60 * 60 * 1000); // Every hour
  }

  addListener(id: string, callback: (notification: NotificationPayload) => void): void {
    this.listeners.set(id, callback);
  }

  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();

// VAPID keys for push notifications (replace with your own)
export const PUSH_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxEfqvde8lZJs6iS9JM9S8kI9v8dXjY8Z7l3K9l0Mn6N8v0K9j8H7l3K9l0Mn6N8v0K9j8H7l3K';