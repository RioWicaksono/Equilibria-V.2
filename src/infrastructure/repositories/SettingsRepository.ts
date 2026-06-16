import prisma from '../database/PrismaClient';

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  currency: string;
  autoLockTimeout: number;
}

export async function getSettings(): Promise<Settings> {
  const settings = await prisma.userSettings.findFirst();
  if (!settings) return { theme: 'dark', language: 'id', currency: 'IDR', autoLockTimeout: 5 };
  return {
    theme: settings.theme as Settings['theme'],
    language: settings.language,
    currency: settings.currency,
    autoLockTimeout: settings.autoLockTimeout,
  };
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
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
  };
}
