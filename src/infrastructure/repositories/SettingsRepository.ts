import prisma from '../database/PrismaClient';

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  currency: string;
}

export async function getSettings(): Promise<Settings> {
  const settings = await prisma?.userSettings.findFirst();
  return settings || { theme: 'dark', language: 'id', currency: 'IDR' };
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  const updated = await prisma?.userSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });
  return { theme: (updated?.theme as Settings['theme']) || 'dark', language: updated?.language || 'id', currency: updated?.currency || 'IDR' };
}
