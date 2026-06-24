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
  ? ['error', 'warn', 'info']
  : ['error'];

function buildConnectionUrl(baseUrl: string): string {
  if (!baseUrl) return baseUrl;

  const params = new URLSearchParams();

  // SSL requirement for Railway/Neon
  if (!baseUrl.includes('sslmode=')) {
    params.set('sslmode', 'require');
  }

  // Connection pool limits to prevent exhaustion
  if (!baseUrl.includes('connection_limit=')) {
    params.set('connection_limit', '2'); // Reduced from 5 to 2 for stability
  }

  // Query timeout - prevent long-running queries
  if (!baseUrl.includes('statement_timeout=')) {
    params.set('statement_timeout', '10000'); // 10 seconds
  }

  // Idle connection timeout
  if (!baseUrl.includes('pool_timeout=')) {
    params.set('pool_timeout', '5'); // 5 seconds
  }

  // Connection timeout
  if (!baseUrl.includes('connect_timeout=')) {
    params.set('connect_timeout', '10'); // 10 seconds
  }

  // Parse existing URL and merge params
  try {
    const url = new URL(baseUrl);
    params.forEach((value, key) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  } catch {
    // If URL parsing fails, append params directly
    const separator = baseUrl.includes('?') ? '&' : '?';
    return baseUrl + separator + params.toString();
  }
}

async function testConnection(prisma: PrismaClient, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.warn(`[DB] Connection test attempt ${attempt}/${maxRetries} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }
  return false;
}

async function initPrisma(): Promise<PrismaClient> {
  const createClient = (url: string, source: 'railway' | 'neon'): PrismaClient => {
    const safeUrl = buildConnectionUrl(url);

    return new PrismaClient({
      datasources: {
        db: {
          url: safeUrl,
        },
      },
      log: PRISMA_LOG_LEVEL,
    });
  };

  // Primary: Railway (DATABASE_URL)
  const railwayUrl = process.env.DATABASE_URL;

  if (railwayUrl) {
    try {
      const client = createClient(railwayUrl, 'railway');

      if (await testConnection(client)) {
        instance.client = client;
        instance.isConnected = true;
        instance.source = 'railway';
        console.log('[DB] Connected to Railway PostgreSQL (SSL + pool limits enabled)');
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
      const client = createClient(neonUrl, 'neon');

      if (await testConnection(client)) {
        instance.client = client;
        instance.isConnected = true;
        instance.source = 'neon';
        console.log('[DB] Connected to Neon PostgreSQL (SSL + pool limits enabled)');
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
    try {
      await instance.client.$disconnect();
    } catch (error) {
      console.warn('[DB] Disconnect error:', error);
    }
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
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[DB] SIGINT received, disconnecting...');
    await disconnectPrisma();
    process.exit(0);
  });
}
