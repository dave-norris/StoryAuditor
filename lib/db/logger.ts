/**
 * Database Logging Utility
 * 
 * This module provides logging functions for database operations,
 * with support for multiple log levels and sensitive data sanitization.
 */

import { ConfigLoader } from './config';

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  operation: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

/**
 * Database Logger class
 * 
 * Provides static methods for logging database operations with
 * automatic sensitive data sanitization.
 */
export class DatabaseLogger {
  private static minLogLevel: LogLevel = 'info';
  private static logHistory: LogEntry[] = [];
  private static maxHistorySize: number = 1000;

  /**
   * Set the minimum log level
   * 
   * @param level - The minimum log level to output
   */
  static setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }

  /**
   * Log a debug message
   * 
   * @param component - The component logging the message
   * @param operation - The operation being performed
   * @param message - The log message
   * @param context - Optional context data
   */
  static debug(
    component: string,
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.log('debug', component, operation, message, context);
  }

  /**
   * Log an info message
   * 
   * @param component - The component logging the message
   * @param operation - The operation being performed
   * @param message - The log message
   * @param context - Optional context data
   */
  static info(
    component: string,
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.log('info', component, operation, message, context);
  }

  /**
   * Log a warning message
   * 
   * @param component - The component logging the message
   * @param operation - The operation being performed
   * @param message - The log message
   * @param error - Optional error object
   * @param context - Optional context data
   */
  static warn(
    component: string,
    operation: string,
    message: string,
    error?: Error | Record<string, any>,
    context?: Record<string, any>
  ): void {
    // If error is actually context (Record), shift parameters
    if (error && typeof error === 'object' && !('message' in error)) {
      context = error as Record<string, any>;
      error = undefined;
    }

    if (error instanceof Error) {
      this.logError('warn', component, operation, message, error, context);
    } else {
      this.log('warn', component, operation, message, context);
    }
  }

  /**
   * Log an error message
   * 
   * @param component - The component logging the message
   * @param operation - The operation being performed
   * @param message - The log message
   * @param error - Optional error object
   * @param context - Optional context data
   */
  static error(
    component: string,
    operation: string,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    this.logError('error', component, operation, message, error, context);
  }

  /**
   * Log a critical error message
   * 
   * @param component - The component logging the message
   * @param operation - The operation being performed
   * @param message - The log message
   * @param error - Optional error object
   * @param context - Optional context data
   */
  static critical(
    component: string,
    operation: string,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    this.logError('critical', component, operation, message, error, context);
  }

  /**
   * Internal log method
   * 
   * @private
   */
  private static log(
    level: LogLevel,
    component: string,
    operation: string,
    message: string,
    context?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      operation,
      message: this.sanitizeMessage(message),
      context: context ? this.sanitizeContext(context) : undefined,
    };

    this.storeEntry(entry);
    this.outputEntry(entry);
  }

  /**
   * Internal error log method
   * 
   * @private
   */
  private static logError(
    level: LogLevel,
    component: string,
    operation: string,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      operation,
      message: this.sanitizeMessage(message),
      context: context ? this.sanitizeContext(context) : undefined,
      error: error ? {
        type: error.name,
        message: this.sanitizeMessage(error.message),
        stack: error.stack,
      } : undefined,
    };

    this.storeEntry(entry);
    this.outputEntry(entry);
  }

  /**
   * Sanitize a message by removing sensitive information
   * 
   * @private
   */
  private static sanitizeMessage(message: string): string {
    if (!message) {
      return message;
    }

    let sanitized = message;

    // Remove passwords from connection strings
    sanitized = sanitized.replace(
      /postgresql:\/\/[^:]+:([^@]+)@/g,
      'postgresql://***:***@'
    );
    sanitized = sanitized.replace(
      /postgres:\/\/[^:]+:([^@]+)@/g,
      'postgres://***:***@'
    );

    // Remove password= parameters
    sanitized = sanitized.replace(
      /password\s*=\s*[^\s,;)]+/gi,
      'password=***'
    );

    // Remove API keys and tokens (sk_live_*, sk_test_*, etc.)
    sanitized = sanitized.replace(
      /sk_(?:live|test)_[a-zA-Z0-9]+/g,
      'sk_***'
    );

    // Remove generic API keys and tokens
    sanitized = sanitized.replace(
      /(?:api[_-]?key|token|secret|authorization)\s*[:=]\s*[^\s,;)]+/gi,
      '$1=***'
    );

    return sanitized;
  }

  /**
   * Sanitize context data by removing sensitive information
   * 
   * @private
   */
  private static sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Store log entry in history
   * 
   * @private
   */
  private static storeEntry(entry: LogEntry): void {
    this.logHistory.push(entry);

    // Keep history size under control
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Output log entry to console
   * 
   * @private
   */
  private static outputEntry(entry: LogEntry): void {
    // Check if this level should be logged
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const minIndex = levels.indexOf(this.minLogLevel);
    const currentIndex = levels.indexOf(entry.level);

    if (currentIndex < minIndex) {
      return;
    }

    // Format the log message
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] [${entry.operation}]`;
    const fullMessage = `${prefix} ${entry.message}`;

    // Output to appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage, entry.context || '');
        break;
      case 'info':
        console.info(fullMessage, entry.context || '');
        break;
      case 'warn':
        console.warn(fullMessage, entry.context || '');
        break;
      case 'error':
        console.error(fullMessage, entry.error || entry.context || '');
        break;
      case 'critical':
        console.error(fullMessage, entry.error || entry.context || '');
        break;
    }
  }

  /**
   * Get log history
   * 
   * @returns Array of log entries
   */
  static getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  static clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Get logs filtered by level
   * 
   * @param level - The log level to filter by
   * @returns Array of log entries matching the level
   */
  static getByLevel(level: LogLevel): LogEntry[] {
    return this.logHistory.filter(entry => entry.level === level);
  }

  /**
   * Get logs filtered by component
   * 
   * @param component - The component to filter by
   * @returns Array of log entries from the component
   */
  static getByComponent(component: string): LogEntry[] {
    return this.logHistory.filter(entry => entry.component === component);
  }

  /**
   * Get logs filtered by operation
   * 
   * @param operation - The operation to filter by
   * @returns Array of log entries for the operation
   */
  static getByOperation(operation: string): LogEntry[] {
    return this.logHistory.filter(entry => entry.operation === operation);
  }
}
