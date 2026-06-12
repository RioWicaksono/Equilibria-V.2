import pino from 'pino';

// Simple logger without pino-pretty transport to avoid build issues
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create child logger for specific modules
export const createModuleLogger = (moduleName: string) => {
  return logger.child({ module: moduleName });
};

// Pre-configured loggers
export const apiLogger = createModuleLogger('api');
export const dbLogger = createModuleLogger('database');
export const telegramLogger = createModuleLogger('telegram');
export const authLogger = createModuleLogger('auth');
export const cacheLogger = createModuleLogger('cache');

// Helper functions
export const logRequest = (req: { method: string; url: string; ip?: string }, userId?: string) => {
  apiLogger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId,
  });
};

export const logResponse = (method: string, url: string, statusCode: number, durationMs: number) => {
  apiLogger.info({
    type: 'response',
    method,
    url,
    statusCode,
    durationMs,
  });
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
  });
};

export const logDatabaseOperation = (operation: string, table: string, durationMs: number, success: boolean) => {
  dbLogger.info({
    type: 'db_operation',
    operation,
    table,
    durationMs,
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