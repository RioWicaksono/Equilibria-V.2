/**
 * Application Configuration
 * Centralized configuration following DDD principles
 */

// App Info
export const APP_CONFIG = {
  name: 'Equilibria',
  version: '2.0.0',
  description: 'Aplikasi pencatatan keuangan pribadi',
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
} as const;

// Environment
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// API Configuration
export const API_CONFIG = {
  secretKey: process.env.API_SECRET_KEY || '',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
} as const;

// Database
export const DATABASE_URL = process.env.DATABASE_URL || '';

// Telegram
export const TELEGRAM_CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  enabled: !!process.env.TELEGRAM_BOT_TOKEN,
} as const;

// Push Notifications (VAPID)
export const PUSH_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  email: process.env.VAPID_EMAIL || 'mailto:admin@equilibria.app',
  enabled: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
} as const;

// Security
export const SECURITY_CONFIG = {
  csrfEnabled: true,
  rateLimitEnabled: true,
  corsEnabled: true,
} as const;

// Feature Flags
export const FEATURES = {
  telegram: TELEGRAM_CONFIG.enabled,
  pushNotifications: PUSH_CONFIG.enabled,
  offlineSupport: true,
  biometricAuth: true,
} as const;

// Validation Rules
export const VALIDATION_CONFIG = {
  transaction: {
    maxDescriptionLength: 500,
    maxCategoryLength: 100,
    minAmount: 1,
    maxAmount: 999999999999,
  },
  budget: {
    maxCategoryLength: 100,
    minLimit: 1000,
    maxLimit: 999999999999,
  },
  wallet: {
    maxNameLength: 50,
    maxDescriptionLength: 200,
  },
  goal: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    minTargetAmount: 1000,
  },
} as const;

// Export all config
export default {
  app: APP_CONFIG,
  api: API_CONFIG,
  database: DATABASE_URL,
  telegram: TELEGRAM_CONFIG,
  push: PUSH_CONFIG,
  security: SECURITY_CONFIG,
  features: FEATURES,
  validation: VALIDATION_CONFIG,
  env: {
    appUrl: APP_URL,
    nodeEnv: NODE_ENV,
    isProduction: IS_PRODUCTION,
    isDevelopment: IS_DEVELOPMENT,
  },
};