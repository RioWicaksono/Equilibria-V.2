/**
 * Error Tracking Service
 * Captures and reports errors for debugging and monitoring
 */

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  context: {
    url?: string;
    method?: string;
    userAgent?: string;
    userId?: string;
  };
  metadata?: Record<string, unknown>;
  level: 'error' | 'warning' | 'info';
}

// In-memory error store (in production, use external service like Sentry)
const errorStore: ErrorReport[] = [];
const MAX_ERRORS = 100;

// Error levels
export const ErrorLevel = {
  INFO: 'info' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
} as const;

// Generate error ID
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Capture error
export function captureError(
  error: Error | string,
  context: ErrorReport['context'] = {},
  metadata?: Record<string, unknown>,
  level: ErrorReport['level'] = 'error'
): string {
  const id = generateErrorId();
  const timestamp = new Date().toISOString();

  const report: ErrorReport = {
    id,
    timestamp,
    message: typeof error === 'string' ? error : error.message,
    stack: error instanceof Error ? error.stack : undefined,
    context: {
      url: context.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      ...context,
    },
    metadata,
    level,
  };

  // Store error
  errorStore.push(report);

  // Limit store size
  if (errorStore.length > MAX_ERRORS) {
    errorStore.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${level.toUpperCase()}] ${report.message}`, {
      id,
      ...metadata,
    });
  }

  return id;
}

// Capture API error
export function captureAPIError(
  error: Error,
  endpoint: string,
  method: string,
  statusCode?: number
): string {
  return captureError(error, { url: endpoint, method }, { statusCode }, 'error');
}

// Capture client error
export function captureClientError(
  error: Error,
  userId?: string
): string {
  return captureError(error, { userId }, {}, 'error');
}

// Get recent errors
export function getRecentErrors(limit = 50): ErrorReport[] {
  return errorStore.slice(-limit);
}

// Get errors by level
export function getErrorsByLevel(level: ErrorReport['level']): ErrorReport[] {
  return errorStore.filter((e) => e.level === level);
}

// Get error by ID
export function getErrorById(id: string): ErrorReport | undefined {
  return errorStore.find((e) => e.id === id);
}

// Clear errors
export function clearErrors(): void {
  errorStore.length = 0;
}

// Get error count
export function getErrorCount(): { total: number; byLevel: Record<string, number> } {
  const byLevel: Record<string, number> = {
    info: 0,
    warning: 0,
    error: 0,
  };

  errorStore.forEach((e) => {
    byLevel[e.level]++;
  });

  return {
    total: errorStore.length,
    byLevel,
  };
}

// Client-side error boundary hook - returns cleanup function
export function useErrorTracking(): (() => void) | undefined {
  if (typeof window === 'undefined') return undefined;

  // Handler references for proper cleanup
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureError(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      {},
      { type: 'unhandled_rejection' },
      'error'
    );
  };

  const handleGlobalError = (event: ErrorEvent) => {
    captureError(
      event.error instanceof Error
        ? event.error
        : new Error(event.message),
      {},
      { type: 'global_error' },
      'error'
    );
  };

  // Add listeners
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleGlobalError);

  // Return cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleGlobalError);
  };
}

export default {
  captureError,
  captureAPIError,
  captureClientError,
  getRecentErrors,
  getErrorsByLevel,
  getErrorById,
  clearErrors,
  getErrorCount,
  useErrorTracking,
};