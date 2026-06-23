import { PrismaClient, Prisma } from '@prisma/client';

// Railway PostgreSQL SSL requirement
const SSL_CONFIG = {
  ssl: {
    rejectUnauthorized: false,
  },
};

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
  // Add connection pool limits and SSL
  let safeUrl = datasourceUrl;
  if (!safeUrl.includes('sslmode=')) {
    safeUrl = safeUrl.includes('?')
      ? `${safeUrl}&sslmode=require`
      : `${safeUrl}?sslmode=require`;
  }
  // Add connection pool settings
  if (!safeUrl.includes('connection_limit=')) {
    safeUrl = `${safeUrl}&connection_limit=5`;
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: safeUrl,
      },
    },
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
      // Ensure SSL is enabled for Railway
      let safeUrl = railwayUrl;
      if (!safeUrl.includes('sslmode=')) {
        safeUrl = safeUrl.includes('?')
          ? `${safeUrl}&sslmode=require`
          : `${safeUrl}?sslmode=require`;
      }

      const client = new PrismaClient({
        datasources: {
          db: {
            url: safeUrl,
          },
        },
        log: PRISMA_LOG_LEVEL,
      });

      if (await testConnection(client)) {
        instance.client = client;
        instance.isConnected = true;
        instance.source = 'railway';
        console.log('[DB] Connected to Railway PostgreSQL (SSL enabled)');
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
      let safeUrl = neonUrl;
      if (!safeUrl.includes('sslmode=')) {
        safeUrl = safeUrl.includes('?')
          ? `${safeUrl}&sslmode=require`
          : `${safeUrl}?sslmode=require`;
      }

      const client = new PrismaClient({
        datasources: {
          db: {
            url: safeUrl,
          },
        },
        log: PRISMA_LOG_LEVEL,
      });

      if (await testConnection(client)) {
        instance.client = client;
        instance.isConnected = true;
        instance.source = 'neon';
        console.log('[DB] Connected to Neon PostgreSQL (SSL enabled)');
        return client;
      }
      await client.$disconnect().catch(() => {});
    } catch (error) {
      console.warn('[DB] Neon connection failed:', error);
    }
  }

  throw new Error('[DB] All database connections failed');
}

// Singleton pattern - reuse same instance
const prismaClientSingleton = async (): Promise<PrismaClient> => {
  if (!instance.client || !instance.isConnected) {
    await initPrisma();
  }
  return instance.client!;
};

// Export async version only (avoids duplicate instances)
export const getPrismaAsync = prismaClientSingleton;

// For backward compatibility - returns the singleton
export const prisma = {
  get client() {
    if (!instance.client) {
      // Sync access - initialize lazily
      initPrisma().catch(console.error);
    }
    return instance.client;
  },
} as { client: PrismaClient | null };

export const getDbSource = (): 'railway' | 'neon' | null => instance.source;

export async function disconnectPrisma(): Promise<void> {
  if (instance.client) {
    await instance.client.$disconnect();
    instance.client = null;
    instance.isConnected = false;
    instance.source = null;
    console.log('[DB] Disconnected');
  }
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('[DB] SIGTERM received, disconnecting...');
    await disconnectPrisma();
  });

  process.on('SIGINT', async () => {
    console.log('[DB] SIGINT received, disconnecting...');
    await disconnectPrisma();
  });
}
