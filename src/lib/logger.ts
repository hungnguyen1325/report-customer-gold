const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  /**
   * Information logs: Only displayed in development mode.
   * Suppressed in production to keep logs clean and reduce I/O overhead.
   */
  log: (...args: any[]) => {
    if (!isProd) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (!isProd) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Error logs: Always logged, but sanitized in production so secrets or internal
   * connection strings are never exposed in production logs.
   */
  error: (tag: string, error?: any) => {
    if (isProd) {
      const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Internal Error';
      console.error(`[PROD ERROR][${tag}]: ${msg}`);
    } else {
      console.error(`[DEV ERROR][${tag}]:`, error);
    }
  },
};

/**
 * Returns a safe error message for API client responses.
 * In dev: returns detailed message for quick debugging.
 * In prod: hides internal SQL/driver details to prevent information disclosure.
 */
export function getSafeErrorMessage(error: any, fallbackMessage: string = 'Đã xảy ra lỗi máy chủ'): string {
  if (!isProd) {
    return error instanceof Error ? error.message : String(error);
  }
  // In production, keep user-friendly client errors or return safe fallback
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    return error.message.replace('VALIDATION:', '').trim();
  }
  return fallbackMessage;
}
