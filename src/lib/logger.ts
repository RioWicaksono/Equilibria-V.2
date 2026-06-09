import pino from 'pino';

// Create logger instance with structured output
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({
      service: 'equilibria-finance',
      env: process.env.NODE_ENV || 'development',
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Pre-configured loggers for different parts of the app
export const apiLogger = createModuleLogger('api');
export const dbLogger = createModuleLogger('database');
export const telegramLogger = createModuleLogger('telegram');
export const authLogger = createModuleLogger('auth');
export const cacheLogger = createModuleLogger('cache');

// Helper functions for common log scenarios
export const logRequest = (req: { method: string; url: string; ip?: string }, userId?: string) => {
  apiLogger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId,
  }, `Incoming request: ${req.method} ${req.url}`);
};

export const logResponse = (req: { method: string; url: string }, statusCode: number, duration: number) => {
  apiLogger.info({
    type: 'response',
    method: req.method,
    url: req.url,
    statusCode,
    durationMs: duration,
  }, `Request completed: ${req.method} ${req.url} - ${statusCode}`);
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  apiLogger.error({
    type: 'error',
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    ...context,
  }, `Error occurred: ${error.message}`);
};

export const logDatabaseOperation = (operation: string, table: string, duration: number, success: boolean) => {
  dbLogger.info({
    type: 'db_operation',
    operation,
    table,
    durationMs: duration,
    success,
  });
};

export const logSecurityEvent = (event: string, details: Record<string, unknown>) => {
  authLogger.warn({
    type: 'security',
    event,
    ...details,
  });
};

export default logger;