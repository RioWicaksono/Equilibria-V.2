import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

  // If no database URL, return null - API routes will handle fallback
  if (!dbUrl) {
    console.warn('[PrismaClient] No database URL found, using local fallback');
    return null;
  }

  try {
    return new PrismaClient({
      datasourceUrl: dbUrl,
    });
  } catch (error) {
    console.warn('[PrismaClient] Failed to initialize:', error);
    return null;
  }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalThis.prismaGlobal = prisma;
}