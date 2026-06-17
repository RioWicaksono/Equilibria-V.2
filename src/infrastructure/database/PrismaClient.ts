import { PrismaClient, Prisma } from '@prisma/client';

interface PrismaInstance {
  client: PrismaClient | null;
  isConnected: boolean;
  source: 'railway' | 'neon' | null;
}

const instance: PrismaInstance = {
  client: null,
  isConnected: false,
  source: null,
};

const PRISMA_LOG_LEVEL: Prisma.LogLevel[] = process.env.NODE_ENV === 'development'
  ? ['error', 'warn']
  : ['error'];

async function createPrismaClient(datasourceUrl: string): Promise<PrismaClient> {
  return new PrismaClient({
    datasourceUrl,
    log: PRISMA_LOG_LEVEL,
  });
}

async function testConnection(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function initPrisma(): Promise<PrismaClient> {
  // Primary: Railway (DATABASE_URL)
  const railwayUrl = process.env.DATABASE_URL;

  if (railwayUrl) {
    try {
      const client = await createPrismaClient(railwayUrl);
      if (await testConnection(client)) {
        instance.client = client;
        instance.isConnected = true;
        instance.source = 'railway';
        console.log('[DB] Connected to Railway PostgreSQL (Primary)');
        return client;
      }
      await client.$disconnect().catch(() => {});
    } catch (error) {
      console.warn('[DB] Railway connection failed:', error);
    }
  }

  // Fallback: NeonDB (NEON_DATABASE_URL)
  const neonUrl = process.env.NEON_DATABASE_URL;
  if (neonUrl && neonUrl !== railwayUrl) {
    try {
      const client = await createPrismaClient(neonUrl);
      if (await testConnection(client)) {
        instance.client = client;
        instance.isConnected = true;
        instance.source = 'neon';
        console.log('[DB] Connected to Neon PostgreSQL (Backup)');
        return client;
      }
      await client.$disconnect().catch(() => {});
    } catch (error) {
      console.warn('[DB] Neon connection failed:', error);
    }
  }

  throw new Error('[DB] All database connections failed');
}

// Singleton pattern with failover
const prismaClientSingleton = async () => {
  if (!instance.client || !instance.isConnected) {
    await initPrisma();
  }
  return instance.client!;
};

// For backward compatibility - sync access (uses Railway only)
declare const globalThis: {
  prismaGlobal: PrismaClient | undefined;
} & typeof global;

const prismaSync = globalThis.prismaGlobal ?? new PrismaClient({
  log: PRISMA_LOG_LEVEL,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prismaSync;
}

// Export both sync (for backward compat) and async (for failover)
export { prismaSync as prisma };
export { prismaClientSingleton as getPrismaAsync };

export const getDbSource = (): 'railway' | 'neon' | null => instance.source;

export async function disconnectPrisma(): Promise<void> {
  if (instance.client) {
    await instance.client.$disconnect();
    instance.client = null;
    instance.isConnected = false;
    instance.source = null;
  }
}
