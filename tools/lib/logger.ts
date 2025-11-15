/**
 * Logger Utility
 * 
 * Provides logging functionality for transparency and traceability
 * across all data transformation scripts.
 * 
 * Features:
 * - Timestamped log messages
 * - Different log levels (info, success, error)
 * - Execution time tracking
 */

/**
 * Logger for transparency and traceability
 */
export class Logger {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  info(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`);
  }

  success(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[SUCCESS] ${timestamp} - ${message}`);
  }

  error(message: string, error?: unknown) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`);
    if (error) {
      console.error(error);
    }
  }

  logDuration() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.info(`Total execution time: ${duration}s`);
  }
}
