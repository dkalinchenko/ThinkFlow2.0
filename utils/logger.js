/**
 * Logger utility for consistent logging throughout the application
 */
class Logger {
  constructor() {
    this.debugEnabled = process.env.NODE_ENV !== 'production';
  }

  /**
   * Log an informational message
   * @param {string} context - The context of the log (e.g., 'SERVER', 'DATABASE')
   * @param {string} message - The message to log
   * @param {any} data - Optional data to include in the log
   */
  info(context, message, data) {
    console.log(`[INFO][${context}] ${message}`, data !== undefined ? data : '');
  }

  /**
   * Log a warning message
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   * @param {any} data - Optional data to include in the log
   */
  warn(context, message, data) {
    console.warn(`[WARN][${context}] ${message}`, data !== undefined ? data : '');
  }

  /**
   * Log an error message
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   * @param {Error|any} error - The error object or data
   */
  error(context, message, error) {
    console.error(`[ERROR][${context}] ${message}`);
    if (error instanceof Error) {
      console.error(`Stack: ${error.stack}`);
    } else if (error !== undefined) {
      console.error(error);
    }
  }

  /**
   * Log a debug message (only in non-production environments)
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   * @param {any} data - Optional data to include in the log
   */
  debug(context, message, data) {
    if (this.debugEnabled) {
      console.log(`[DEBUG][${context}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether debug logging should be enabled
   */
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled;
  }
}

module.exports = new Logger(); 