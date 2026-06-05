'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { notificationService } from '@/infrastructure/services/NotificationService';

export function useNotifications() {
  const requestPermission = useCallback(async () => {
    return await notificationService.requestPermission();
  }, []);

  const sendNotification = useCallback((title: string, body: string, data?: any) => {
    notificationService.sendNotification({
      title,
      body,
      data
    });
  }, []);

  const checkReminders = useCallback(() => {
    notificationService.checkReminders();
  }, []);

  const checkRecurringDue = useCallback(() => {
    notificationService.checkRecurringDue();
  }, []);

  const checkDebtsDue = useCallback(() => {
    notificationService.checkDebtsDue();
  }, []);

  return {
    requestPermission,
    sendNotification,
    checkReminders,
    checkRecurringDue,
    checkDebtsDue,
    isSupported: notificationService.isSupported(),
    isPermissionGranted: notificationService.isPermissionGranted(),
    getPermissionStatus: notificationService.getPermissionStatus()
  };
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  useEffect(() => {
    const initNotifications = async () => {
      const granted = await notificationService.init();
      if (granted) {
        notificationService.scheduleDailyReminderCheck();
      }
    };

    initNotifications();

    // Handle visibility change to check for notifications
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        notificationService.checkReminders();
        notificationService.checkRecurringDue();
        notificationService.checkDebtsDue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}