/**
 * Configuration Index
 * DDD-style configuration module
 */

// Re-export from app.config
export {
  APP_CONFIG,
  APP_URL,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  API_CONFIG,
  DATABASE_URL,
  TELEGRAM_CONFIG,
  PUSH_CONFIG,
  SECURITY_CONFIG,
  FEATURES,
  VALIDATION_CONFIG,
} from './app.config';

// Re-export from environment
export { environments, currentEnv, type Environment } from './environment';

// Type exports for TypeScript
export type { default as AppConfig } from './app.config';
