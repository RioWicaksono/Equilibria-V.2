import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  currency: string;
  autoLockTimeout: number;
  telegramToken: string;
}

export async function getSettings(): Promise<Settings> {
  const prisma = await getPrismaAsync();
  const settings = await prisma.userSettings.findFirst();
  if (!settings) return { theme: 'dark', language: 'id', currency: 'IDR', autoLockTimeout: 5, telegramToken: '' };
  return {
    theme: settings.theme as Settings['theme'],
    language: settings.language,
    currency: settings.currency,
    autoLockTimeout: settings.autoLockTimeout,
    telegramToken: settings.telegramToken || '',
  };
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  const prisma = await getPrismaAsync();
  const updated = await prisma.userSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });
  return {
    theme: (updated?.theme as Settings['theme']) || 'dark',
    language: updated?.language || 'id',
    currency: updated?.currency || 'IDR',
    autoLockTimeout: updated?.autoLockTimeout ?? 5,
    telegramToken: updated?.telegramToken || '',
  };
}
