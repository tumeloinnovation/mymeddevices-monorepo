/**
 * Logger utility and Console Silencer for MyMedDevices frontend applications.
 *
 * All logs on the frontend console are suppressed by default unless
 * NEXT_PUBLIC_ENABLE_LOGS is explicitly set to 'true'.
 */

const isLoggingEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (isLoggingEnabled) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isLoggingEnabled) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (isLoggingEnabled) console.error(...args);
  },
  debug: (...args: any[]) => {
    if (isLoggingEnabled) console.debug(...args);
  },
  info: (...args: any[]) => {
    if (isLoggingEnabled) console.info(...args);
  },
};

/**
 * Mutes all browser window console methods (log, debug, info, warn, error)
 * unless NEXT_PUBLIC_ENABLE_LOGS is 'true'.
 */
export function silenceConsole() {
  if (typeof window === 'undefined') return;
  if (isLoggingEnabled) return;

  const noop = () => {};
  try {
    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.error = noop;
  } catch (e) {
    // Ignore if console object is read-only in strict environments
  }
}

// Auto-run on module load if executed in browser context
if (typeof window !== 'undefined') {
  silenceConsole();
}
