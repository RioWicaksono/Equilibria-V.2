import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  currency: string;
  autoLockTimeout: number;
  telegramToken: string;
  // PIN Lock fields
  isPinEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  failedAttempts: number;
  lockoutUntil: string | null;
}

interface PrismaUserSettings {
  id: string;
  theme: string;
  language: string;
  currency: string;
  autoLockTimeout: number;
  telegramToken: string | null;
  updatedAt: Date;
  // PIN Lock fields
  isPinEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  failedAttempts: number;
  lockoutUntil: Date | null;
}

export async function getSettings(): Promise<Settings> {
  const prisma = await getPrismaAsync();
  const settings = await prisma.userSettings.findFirst();
  if (!settings) return {
    theme: 'dark',
    language: 'id',
    currency: 'IDR',
    autoLockTimeout: 5,
    telegramToken: '',
    isPinEnabled: false,
    pinHash: null,
    pinSalt: null,
    failedAttempts: 0,
    lockoutUntil: null,
  };

  const s = settings as unknown as PrismaUserSettings;
  return {
    theme: s.theme as Settings['theme'],
    language: s.language,
    currency: s.currency,
    autoLockTimeout: s.autoLockTimeout,
    telegramToken: s.telegramToken || '',
    isPinEnabled: s.isPinEnabled ?? false,
    pinHash: s.pinHash ?? null,
    pinSalt: s.pinSalt ?? null,
    failedAttempts: s.failedAttempts ?? 0,
    lockoutUntil: s.lockoutUntil?.toISOString() ?? null,
  };
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  const prisma = await getPrismaAsync();

  // Prepare data for Prisma - convert string dates to Date objects
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      // Convert lockoutUntil ISO string to Date for database
      if (key === 'lockoutUntil' && typeof value === 'string') {
        cleanData[key] = value ? new Date(value) : null;
      } else {
        cleanData[key] = value;
      }
    }
  }

  const updated = await prisma.userSettings.upsert({
    where: { id: 'default' },
    update: cleanData,
    create: { id: 'default', ...cleanData },
  });

  const s = updated as unknown as PrismaUserSettings;
  return {
    theme: s.theme as Settings['theme'],
    language: s.language,
    currency: s.currency,
    autoLockTimeout: s.autoLockTimeout,
    telegramToken: s.telegramToken || '',
    isPinEnabled: s.isPinEnabled ?? false,
    pinHash: s.pinHash ?? null,
    pinSalt: s.pinSalt ?? null,
    failedAttempts: s.failedAttempts ?? 0,
    lockoutUntil: s.lockoutUntil?.toISOString() ?? null,
  };
}
