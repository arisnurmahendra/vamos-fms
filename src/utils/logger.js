/**
 * VAMOS FMS - Smart Logger Utility
 * [FE-007] Smart Logger Utility
 * Menampilkan log console hanya pada mode development atau jika VITE_VIEW_LOG diaktifkan.
 */

const isDev = import.meta.env.DEV || import.meta.env.VITE_VIEW_LOG === 'true';

export const logger = {
  info(...args) {
    if (isDev) {
      console.log('%c[VAMOS INFO]', 'color: #3b82f6; font-weight: bold;', ...args);
    }
  },

  warn(...args) {
    if (isDev) {
      console.warn('%c[VAMOS WARN]', 'color: #f59e0b; font-weight: bold;', ...args);
    }
  },

  error(...args) {
    // Error selalu ditampilkan untuk membantu debugging kritis
    console.error('%c[VAMOS ERROR]', 'color: #ef4444; font-weight: bold;', ...args);
  },

  debug(...args) {
    if (isDev) {
      console.debug('%c[VAMOS DEBUG]', 'color: #8b5cf6; font-weight: bold;', ...args);
    }
  }
};

export default logger;
