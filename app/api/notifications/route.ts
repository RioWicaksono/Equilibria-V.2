/**
 * SSE (Server-Sent Events) Notifications Endpoint
 * Provides real-time notifications for transaction updates, reminders, and system status
 */

import { NextRequest } from 'next/server';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

interface NotificationPayload {
  type: 'TRANSACTION' | 'REMINDER' | 'DEBT' | 'BUDGET' | 'SYSTEM' | 'HEARTBEAT';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function createSSEPayload(payload: NotificationPayload): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function createHeartbeatPayload(): string {
  return createSSEPayload({
    type: 'HEARTBEAT',
    title: 'Connected',
    message: 'SSE connection active',
    timestamp: new Date().toISOString(),
  });
}

async function getUpcomingReminders() {
  try {
    const prisma = await getPrismaAsync();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reminders = await prisma.reminder.findMany({
      where: {
        date: {
          gte: now,
          lte: tomorrow,
        },
        status: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        date: true,
      },
    });

    return reminders;
  } catch {
    return [];
  }
}

async function getUrgentReminders() {
  try {
    const prisma = await getPrismaAsync();
    const now = new Date();

    const reminders = await prisma.reminder.findMany({
      where: {
        urgent: true,
        status: 'PENDING',
        date: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        priority: true,
      },
    });

    return reminders;
  } catch {
    return [];
  }
}

async function getBudgetAlerts() {
  try {
    const prisma = await getPrismaAsync();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const budgets = await prisma.budget.findMany({
      include: {
        budgetUsages: {
          where: {
            Transaction: {
              date: {
                gte: startOfMonth,
                lte: now,
              },
            },
          },
        },
      },
    });

    const alerts: Array<{ category: string; spent: number; limit: number; percentage: number }> = [];

    for (const budget of budgets) {
      const spent = budget.budgetUsages.reduce((sum: number, usage: { amountUsed: number }) => sum + usage.amountUsed, 0);
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      if (percentage >= 80) {
        alerts.push({
          category: budget.category,
          spent,
          limit: budget.limit,
          percentage,
        });
      }
    }

    return alerts;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      const intervalId = setInterval(async () => {
        try {
          const notifications: NotificationPayload[] = [];

          const reminders = await getUpcomingReminders();
          for (const reminder of reminders) {
            notifications.push({
              type: 'REMINDER',
              title: '⏰ Reminder',
              message: `${reminder.title} - Jatuh tempo hari ini!`,
              data: { reminderId: reminder.id },
              timestamp: new Date().toISOString(),
            });
          }

          const urgentReminders = await getUrgentReminders();
          for (const reminder of urgentReminders) {
            notifications.push({
              type: 'REMINDER',
              title: '🚨 Reminder Urgent',
              message: `${reminder.title} - Prioritas ${reminder.priority}`,
              data: { reminderId: reminder.id, urgent: true },
              timestamp: new Date().toISOString(),
            });
          }

          const budgetAlerts = await getBudgetAlerts();
          for (const alert of budgetAlerts) {
            const emoji = alert.percentage >= 100 ? '🚨' : '📊';
            notifications.push({
              type: 'BUDGET',
              title: `${emoji} Budget Alert`,
              message: `Budget ${alert.category} sudah ${alert.percentage.toFixed(0)}% terpakai (Rp ${alert.spent.toLocaleString('id-ID')} / Rp ${alert.limit.toLocaleString('id-ID')})`,
              data: { category: alert.category },
              timestamp: new Date().toISOString(),
            });
          }

          if (notifications.length > 0) {
            for (const notification of notifications) {
              send(createSSEPayload(notification));
            }
          } else {
            send(createHeartbeatPayload());
          }
        } catch {
          send(createHeartbeatPayload());
        }
      }, 60000);

      send(createSSEPayload({
        type: 'SYSTEM',
        title: '🟢 Connected',
        message: 'Real-time notifications aktif. Cek setiap 60 detik.',
        timestamp: new Date().toISOString(),
      }));

      if (typeof request.signal.addEventListener === 'function') {
        const abortHandler = () => {
          clearInterval(intervalId);
          controller.close();
        };

        request.signal.addEventListener('abort', abortHandler);

        setTimeout(() => {
          request.signal.removeEventListener('abort', abortHandler);
        }, 30000);
      }

      setTimeout(() => {
        clearInterval(intervalId);
        controller.close();
      }, 24 * 60 * 60 * 1000);
    },
  });

  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');

  return new Response(stream, {
    headers: {
      'Content-Type': isSafari ? 'text/event-stream' : 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
