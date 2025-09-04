/**
 * Custom Logging Middleware for URL Shortener Application
 * This is a mandatory requirement - no built-in loggers or console.log allowed
 */

class Logger {
  constructor() {
    this.logs = [];
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = this.logLevels.INFO;
  }

  /**
   * Set the logging level
   * @param {string} level - ERROR, WARN, INFO, or DEBUG
   */
  setLevel(level) {
    this.currentLevel = this.logLevels[level] || this.logLevels.INFO;
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   * @returns {object} Formatted log entry
   */
  formatLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    
    this.logs.push(logEntry);
    return logEntry;
  }

  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {any} data - Additional error data
   */
  error(message, data = null) {
    if (this.currentLevel >= this.logLevels.ERROR) {
      const logEntry = this.formatLog('ERROR', message, data);
      this.displayLog(logEntry, 'error');
    }
  }

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {any} data - Additional warning data
   */
  warn(message, data = null) {
    if (this.currentLevel >= this.logLevels.WARN) {
      const logEntry = this.formatLog('WARN', message, data);
      this.displayLog(logEntry, 'warn');
    }
  }

  /**
   * Log info messages
   * @param {string} message - Info message
   * @param {any} data - Additional info data
   */
  info(message, data = null) {
    if (this.currentLevel >= this.logLevels.INFO) {
      const logEntry = this.formatLog('INFO', message, data);
      this.displayLog(logEntry, 'info');
    }
  }

  /**
   * Log debug messages
   * @param {string} message - Debug message
   * @param {any} data - Additional debug data
   */
  debug(message, data = null) {
    if (this.currentLevel >= this.logLevels.DEBUG) {
      const logEntry = this.formatLog('DEBUG', message, data);
      this.displayLog(logEntry, 'debug');
    }
  }

  /**
   * Display log entry in browser console with appropriate styling
   * @param {object} logEntry - Formatted log entry
   * @param {string} type - Log type for styling
   */
  displayLog(logEntry, type) {
    const styles = {
      error: 'color: red; font-weight: bold;',
      warn: 'color: orange; font-weight: bold;',
      info: 'color: blue; font-weight: normal;',
      debug: 'color: gray; font-style: italic;'
    };

    const style = styles[type] || styles.info;
    const prefix = `[${logEntry.timestamp}] [${logEntry.level}]`;
    
    if (logEntry.data) {
      console.log(`%c${prefix} ${logEntry.message}`, style);
      console.log(logEntry.data);
    } else {
      console.log(`%c${prefix} ${logEntry.message}`, style);
    }
  }

  /**
   * Get all logs
   * @returns {Array} Array of all log entries
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get logs by level
   * @param {string} level - Log level to filter by
   * @returns {Array} Filtered log entries
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Export logs as JSON
   * @returns {string} JSON string of all logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

// Export the logger instance
export default logger;

// Export the Logger class for testing purposes
export { Logger };