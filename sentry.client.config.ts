import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN || '',

  // Only enable in production
  enabled: NODE_ENV === 'production',

  // Performance monitoring
  tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,

  // Error sampling
  sampleRate: 1.0,

  // Replay errors in production
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: NODE_ENV || 'development',

  // Ignored errors (common noise)
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'The user aborted a request',
  ],

  // Ignore transactions for health checks
  denyUrls: [
    '/api/health',
    '/_health',
  ],

  // Custom tags
  initialScope: {
    tags: {
      version: process.env.npm_package_version || 'unknown',
    },
  },
});

export default Sentry;
