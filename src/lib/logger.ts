/**
 * Logger Utility
 * Centralized logging with environment-aware behavior
 * Suppresses logs in production, provides structured output in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: string;
    data?: unknown;
}

const isDev = process.env.NODE_ENV !== 'production';

// Color codes for terminal output
const colors = {
    debug: '\x1b[36m',  // Cyan
    info: '\x1b[32m',   // Green
    warn: '\x1b[33m',   // Yellow
    error: '\x1b[31m',  // Red
    reset: '\x1b[0m',   // Reset
};

/**
 * Format a log entry for output
 */
function formatLog(entry: LogEntry): string {
    const prefix = entry.context ? `[${entry.context}]` : '';
    return `${prefix} ${entry.message}`;
}

/**
 * Core log function
 */
function log(level: LogLevel, context: string, message: string, data?: unknown): void {
    // Skip non-error logs in production
    if (!isDev && level !== 'error') return;

    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        data,
    };

    const formatted = formatLog(entry);
    const color = colors[level];

    switch (level) {
        case 'debug':
            if (isDev) console.debug(`${color}[DEBUG]${colors.reset}`, formatted, data ?? '');
            break;
        case 'info':
            console.info(`${color}[INFO]${colors.reset}`, formatted, data ?? '');
            break;
        case 'warn':
            console.warn(`${color}[WARN]${colors.reset}`, formatted, data ?? '');
            break;
        case 'error':
            console.error(`${color}[ERROR]${colors.reset}`, formatted, data ?? '');
            break;
    }
}

/**
 * Logger instance with namespaced context
 */
export function createLogger(context: string) {
    return {
        debug: (message: string, data?: unknown) => log('debug', context, message, data),
        info: (message: string, data?: unknown) => log('info', context, message, data),
        warn: (message: string, data?: unknown) => log('warn', context, message, data),
        error: (message: string, data?: unknown) => log('error', context, message, data),
    };
}

// Pre-configured loggers for common contexts
export const serverLog = createLogger('Server');
export const gameLog = createLogger('Game');
export const roomLog = createLogger('Room');
export const sabotageLog = createLogger('Sabotage');
export const socketLog = createLogger('Socket');
