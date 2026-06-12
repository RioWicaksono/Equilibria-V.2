/**
 * Environment Configuration
 * Environment-specific settings
 */

export const environments = {
  development: {
    debug: true,
    logLevel: 'debug' as const,
    enableCors: true,
    corsOrigins: ['http://localhost:3000'],
  },
  production: {
    debug: false,
    logLevel: 'error' as const,
    enableCors: true,
    corsOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || '',
    ].filter(Boolean),
  },
  test: {
    debug: false,
    logLevel: 'silent' as const,
    enableCors: false,
    corsOrigins: ['http://localhost:3000'],
  },
} as const;

export type Environment = keyof typeof environments;
export const currentEnv = (process.env.NODE_ENV || 'development') as Environment;