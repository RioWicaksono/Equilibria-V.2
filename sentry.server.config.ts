import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN || '',

  enabled: NODE_ENV === 'production',

  // Include API routes in traces
  tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: NODE_ENV || 'development',

  // Ignored errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'AbortError',
  ],

  // Custom tags
  initialScope: {
    tags: {
      version: process.env.npm_package_version || 'unknown',
    },
  },
});

export default Sentry;
