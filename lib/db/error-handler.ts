/**
 * Database Error Handler
 * 
 * This module provides utilities for classifying, handling, and sanitizing
 * database errors, with support for timeout precedence and sensitive data protection.
 */

import { DatabaseError } from './types';
import { ConfigLoader } from './config';

/**
 * DatabaseErrorHandler class
 * 
 * Provides static methods for handling various types of database errors,
 * including classification, sanitization, and suggestion generation.
 */
export class DatabaseErrorHandler {
  /**
   * Handle connection errors
   * 
   * Classifies a connection error and returns a DatabaseError object
   * with appropriate type, message, and context.
   * 
   * @param error - The error that occurred
   * @param operation - The operation that was being performed
   * @returns DatabaseError object with classified error information
   */
  static handleConnectionError(
    error: Error,
    operation: string = 'connection'
  ): DatabaseError {
    const message = error.message || 'Unknown connection error';
    let type: DatabaseError['type'] = 'connection_failed';
    let suggestion: string | undefined;

    // Classify the error based on the message
    if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
      suggestion = 'The database server is not running or is not listening on the specified port. ' +
        'Verify that PostgreSQL is running and accessible at the configured host and port.';
    } else if (message.includes('ENOTFOUND') || message.includes('getaddrinfo ENOTFOUND')) {
      suggestion = 'The database host could not be resolved. ' +
        'Check that the hostname is correct and that your network connection is working.';
    } else if (message.includes('authentication failed') || message.includes('password authentication failed')) {
      suggestion = 'Authentication failed. Verify that the username and password in DATABASE_URL are correct.';
    } else if (message.includes('does not exist') || message.includes('database') && message.includes('does not exist')) {
      suggestion = 'The specified database does not exist. ' +
        'Create the database using: createdb <database_name>';
    } else if (message.includes('permission denied')) {
      suggestion = 'Permission denied. Verify that the database user has the necessary permissions.';
    } else if (message.includes('ETIMEDOUT') || message.includes('connect ETIMEDOUT')) {
      type = 'timeout';
      suggestion = 'Connection attempt timed out. The database server may be slow or unreachable.';
    }

    return {
      type,
      message: `Connection failed: ${message}`,
      originalError: error,
      context: {
        operation,
        timestamp: new Date(),
      },
      suggestion,
    };
  }

  /**
   * Handle timeout errors
   * 
   * Creates a timeout error with appropriate context and message.
   * Timeout errors take precedence over other error types.
   * 
   * @param operation - The operation that timed out
   * @param timeoutMs - The timeout duration in milliseconds
   * @param duration - The actual duration before timeout
   * @returns DatabaseError object with timeout classification
   */
  static handleTimeoutError(
    operation: string,
    timeoutMs: number,
    duration?: number
  ): DatabaseError {
    return {
      type: 'timeout',
      message: `Operation '${operation}' exceeded timeout of ${timeoutMs}ms`,
      context: {
        operation,
        timestamp: new Date(),
        duration,
      },
      suggestion: 'The operation took too long to complete. ' +
        'This may indicate a slow database connection or server. ' +
        'Try increasing the timeout value or checking database performance.',
    };
  }

  /**
   * Handle query errors
   * 
   * Classifies a query execution error and returns a DatabaseError object.
   * 
   * @param error - The error that occurred
   * @param query - The query that failed
   * @returns DatabaseError object with query error information
   */
  static handleQueryError(
    error: Error,
    query: string = 'unknown query'
  ): DatabaseError {
    const message = error.message || 'Unknown query error';
    let suggestion: string | undefined;

    // Classify the error based on the message
    if (message.includes('syntax error')) {
      suggestion = 'There is a syntax error in the SQL query. ' +
        'Review the query for correct SQL syntax.';
    } else if (message.includes('constraint violation') || message.includes('unique violation') || message.includes('unique constraint')) {
      suggestion = 'A unique constraint was violated. ' +
        'Ensure that the data being inserted does not duplicate existing unique values.';
    } else if (message.includes('foreign key violation') || message.includes('foreign key constraint')) {
      suggestion = 'A foreign key constraint was violated. ' +
        'Ensure that referenced records exist in the related table.';
    } else if (message.includes('permission denied')) {
      suggestion = 'Permission denied for this operation. ' +
        'Verify that the database user has the necessary permissions.';
    } else if (message.includes('relation') && message.includes('does not exist')) {
      suggestion = 'The referenced table does not exist. ' +
        'Verify that the table name is correct and that migrations have been run.';
    } else {
      suggestion = 'Review the query and database schema to ensure they are compatible.';
    }

    return {
      type: 'query_failed',
      message: `Query execution failed: ${message}`,
      originalError: error,
      context: {
        operation: 'query_execution',
        timestamp: new Date(),
      },
      suggestion,
    };
  }

  /**
   * Sanitize error for logging
   * 
   * Removes sensitive information (passwords, credentials) from error messages
   * while preserving error type, operation, and timestamp information.
   * 
   * @param error - The DatabaseError to sanitize
   * @returns Sanitized DatabaseError safe for logging
   */
  static sanitizeError(error: DatabaseError): DatabaseError {
    const sanitized = { ...error };

    // Sanitize the message
    sanitized.message = this.sanitizeString(error.message);

    // Sanitize the suggestion
    if (error.suggestion) {
      sanitized.suggestion = this.sanitizeString(error.suggestion);
    }

    // Remove the original error to prevent exposing sensitive data
    sanitized.originalError = undefined;

    return sanitized;
  }

  /**
   * Get suggestion for resolving an error
   * 
   * Returns an actionable suggestion for resolving the given error.
   * 
   * @param error - The DatabaseError to get a suggestion for
   * @returns String with troubleshooting suggestion
   */
  static getSuggestion(error: DatabaseError): string {
    if (error.suggestion) {
      return error.suggestion;
    }

    // Provide generic suggestions based on error type
    switch (error.type) {
      case 'connection_failed':
        return 'Check that the database is running and that DATABASE_URL is correctly configured.';
      case 'timeout':
        return 'The operation took too long. Try increasing the timeout or checking database performance.';
      case 'query_failed':
        return 'Review the query and database schema to ensure they are compatible.';
      case 'schema_mismatch':
        return 'Run database migrations to sync the schema with the Prisma schema definition.';
      case 'invalid_config':
        return 'Verify that DATABASE_URL is set and follows the correct format.';
      default:
        return 'An unexpected error occurred. Check the error message for more details.';
    }
  }

  /**
   * Sanitize a string by removing sensitive information
   * 
   * Removes passwords, credentials, and other sensitive data from strings.
   * 
   * @param str - The string to sanitize
   * @returns Sanitized string
   */
  private static sanitizeString(str: string): string {
    if (!str) {
      return str;
    }

    let sanitized = str;

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

    // Remove pwd= parameters
    sanitized = sanitized.replace(
      /pwd\s*=\s*[^\s,;)]+/gi,
      'pwd=***'
    );

    // Remove API keys and tokens
    sanitized = sanitized.replace(
      /(?:api[_-]?key|token|secret|authorization)\s*[:=]\s*[^\s,;)]+/gi,
      '$1=***'
    );

    return sanitized;
  }
}
