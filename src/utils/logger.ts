/**
 * Environment-aware logger that suppresses output in production builds.
 * Provides structured log levels for consistent debugging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const IS_PRODUCTION = import.meta.env.PROD;
const MIN_LEVEL: LogLevel = IS_PRODUCTION ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LEVEL];
}

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

/**
 * Creates a scoped logger instance for a specific module/context.
 * In production, only warn and error messages are logged.
 *
 * @param context - The module or component name for log scoping
 * @returns A logger object with debug, info, warn, and error methods
 */
export function createLogger(context: string) {
  return {
    debug(message: string, ...args: unknown[]): void {
      if (shouldLog('debug')) {
        // eslint-disable-next-line no-console
        console.debug(formatMessage('debug', context, message), ...args);
      }
    },

    info(message: string, ...args: unknown[]): void {
      if (shouldLog('info')) {
        // eslint-disable-next-line no-console
        console.info(formatMessage('info', context, message), ...args);
      }
    },

    warn(message: string, ...args: unknown[]): void {
      if (shouldLog('warn')) {
        // eslint-disable-next-line no-console
        console.warn(formatMessage('warn', context, message), ...args);
      }
    },

    error(message: string, ...args: unknown[]): void {
      if (shouldLog('error')) {
        // eslint-disable-next-line no-console
        console.error(formatMessage('error', context, message), ...args);
      }
    },
  };
}
