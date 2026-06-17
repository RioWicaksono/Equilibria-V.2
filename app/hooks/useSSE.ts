'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface SSENotification {
  type: 'TRANSACTION' | 'REMINDER' | 'DEBT' | 'BUDGET' | 'SYSTEM' | 'HEARTBEAT';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

interface UseSSEOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (notification: SSENotification) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    url = '/api/notifications',
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    enabled = true,
  } = options;

  const [notifications, setNotifications] = useState<SSENotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSENotification | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (!enabled) return;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as SSENotification;

          if (notification.type !== 'HEARTBEAT') {
            setNotifications((prev) => [notification, ...prev].slice(0, 50));
          }

          setLastMessage(notification);
          onMessage?.(notification);

          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted' && notification.type !== 'HEARTBEAT') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/icon.svg',
                tag: `equilibria-${notification.type}`,
              });
            }
          }
        } catch (parseError) {
          console.error('[SSE] Failed to parse message:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        setIsConnected(false);
        onError?.(error);

        eventSource.close();

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        } else {
          onDisconnect?.();
        }
      };
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onConnect, onDisconnect, onError, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
    onDisconnect?.();
  }, [onDisconnect]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    notifications,
    lastMessage,
    isConnected,
    connect,
    disconnect,
    clearNotifications,
    dismissNotification,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}

export function useSSEProvider() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(typeof window !== 'undefined' && 'EventSource' in window);
  }, []);

  return { isAvailable };
}
