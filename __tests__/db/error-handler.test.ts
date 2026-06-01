/**
 * Tests for DatabaseErrorHandler
 * 
 * This test suite validates the error classification, sanitization, and
 * suggestion generation functionality of the DatabaseErrorHandler class.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DatabaseErrorHandler } from '../../lib/db/error-handler';
import { DatabaseError } from '../../lib/db/types';

describe('DatabaseErrorHandler', () => {
  describe('handleConnectionError()', () => {
    describe('Error Classification', () => {
      it('should classify ECONNREFUSED errors as connection_failed', () => {
        const error = new Error('connect ECONNREFUSED 127.0.0.1:5432');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('connection_failed');
        expect(result.message).toContain('Connection failed');
        expect(result.suggestion).toContain('database server is not running');
      });

      it('should classify ENOTFOUND errors as connection_failed', () => {
        const error = new Error('getaddrinfo ENOTFOUND localhost');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('connection_failed');
        expect(result.message).toContain('Connection failed');
        expect(result.suggestion).toContain('host could not be resolved');
      });

      it('should classify authentication failed errors as connection_failed', () => {
        const error = new Error('password authentication failed for user "postgres"');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('connection_failed');
        expect(result.suggestion).toContain('username and password');
      });

      it('should classify database does not exist errors as connection_failed', () => {
        const error = new Error('database "storyauditor" does not exist');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('connection_failed');
        expect(result.suggestion).toContain('createdb');
      });

      it('should classify permission denied errors as connection_failed', () => {
        const error = new Error('permission denied for schema public');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('connection_failed');
        expect(result.suggestion).toContain('permissions');
      });

      it('should classify ETIMEDOUT errors as timeout', () => {
        const error = new Error('connect ETIMEDOUT');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('timeout');
        expect(result.suggestion).toContain('timed out');
      });

      it('should handle unknown errors gracefully', () => {
        const error = new Error('Some unknown error');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.type).toBe('connection_failed');
        expect(result.message).toContain('Connection failed');
        expect(result.context.operation).toBe('connection');
      });
    });

    describe('Context Preservation', () => {
      it('should include operation name in context', () => {
        const error = new Error('Connection failed');
        const operation = 'initial_connection';
        const result = DatabaseErrorHandler.handleConnectionError(error, operation);

        expect(result.context.operation).toBe(operation);
      });

      it('should include timestamp in context', () => {
        const error = new Error('Connection failed');
        const beforeTime = new Date();
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');
        const afterTime = new Date();

        expect(result.context.timestamp).toBeInstanceOf(Date);
        expect(result.context.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(result.context.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      });

      it('should preserve original error', () => {
        const error = new Error('Connection failed');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.originalError).toBe(error);
      });

      it('should use default operation name if not provided', () => {
        const error = new Error('Connection failed');
        const result = DatabaseErrorHandler.handleConnectionError(error);

        expect(result.context.operation).toBe('connection');
      });
    });

    describe('Message Formatting', () => {
      it('should include original error message in result', () => {
        const errorMessage = 'connect ECONNREFUSED 127.0.0.1:5432';
        const error = new Error(errorMessage);
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.message).toContain(errorMessage);
      });

      it('should handle empty error messages', () => {
        const error = new Error('');
        const result = DatabaseErrorHandler.handleConnectionError(error, 'connection');

        expect(result.message).toBeDefined();
        expect(result.message.length).toBeGreaterThan(0);
      });
    });

    describe('Property-Based Tests', () => {
      /**
       * Property 3: Timeout Error Precedence
       * 
       * For any error scenario (connection failure, query failure, timeout),
       * if a timeout occurs, the returned error SHALL always be classified
       * as a timeout error regardless of other concurrent errors.
       * 
       * Validates: Requirements 3.4, 4.5
       */
      it('should classify timeout errors correctly (Property 3)', () => {
        fc.assert(
          fc.property(
            fc.string().filter(s => s.length > 0),
            (operation: string) => {
              const timeoutError = new Error('connect ETIMEDOUT');
              const result = DatabaseErrorHandler.handleConnectionError(timeoutError, operation);

              // Timeout errors should always be classified as timeout
              return result.type === 'timeout';
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * Property 5: Error Context Preservation
       * 
       * For any database error, the error object SHALL preserve the error type,
       * operation name, and timestamp while removing sensitive information.
       * 
       * Validates: Requirements 5.1, 5.2
       */
      it('should preserve error context (Property 5)', () => {
        fc.assert(
          fc.property(
            fc.string().filter(s => s.length > 0),
            fc.string().filter(s => s.length > 0),
            (operation: string, errorMsg: string) => {
              const error = new Error(errorMsg);
              const result = DatabaseErrorHandler.handleConnectionError(error, operation);

              // Context should be preserved
              return (
                result.context.operation === operation &&
                result.context.timestamp instanceof Date &&
                result.type !== undefined &&
                result.message !== undefined
              );
            }
          ),
          { numRuns: 100 }
        );
      });

      /**
       * Property: Error Type Classification Consistency
       * 
       * For any error message, the classification should be consistent
       * across multiple calls with the same error.
       */
      it('should classify errors consistently', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant('connect ECONNREFUSED 127.0.0.1:5432'),
              fc.constant('getaddrinfo ENOTFOUND localhost'),
              fc.constant('password authentication failed'),
              fc.constant('database "test" does not exist'),
              fc.constant('permission denied'),
              fc.constant('connect ETIMEDOUT')
            ),
            (errorMsg: string) => {
              const error1 = new Error(errorMsg);
              const error2 = new Error(errorMsg);

              const result1 = DatabaseErrorHandler.handleConnectionError(error1, 'op1');
              const result2 = DatabaseErrorHandler.handleConnectionError(error2, 'op2');

              // Same error message should produce same error type
              return result1.type === result2.type;
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('handleTimeoutError()', () => {
    it('should create timeout error with correct type', () => {
      const result = DatabaseErrorHandler.handleTimeoutError('query_execution', 5000);

      expect(result.type).toBe('timeout');
    });

    it('should include operation name in message', () => {
      const operation = 'health_check';
      const result = DatabaseErrorHandler.handleTimeoutError(operation, 5000);

      expect(result.message).toContain(operation);
    });

    it('should include timeout duration in message', () => {
      const timeoutMs = 5000;
      const result = DatabaseErrorHandler.handleTimeoutError('operation', timeoutMs);

      expect(result.message).toContain(timeoutMs.toString());
    });

    it('should include duration in context if provided', () => {
      const duration = 4999;
      const result = DatabaseErrorHandler.handleTimeoutError('operation', 5000, duration);

      expect(result.context.duration).toBe(duration);
    });

    it('should include timestamp in context', () => {
      const beforeTime = new Date();
      const result = DatabaseErrorHandler.handleTimeoutError('operation', 5000);
      const afterTime = new Date();

      expect(result.context.timestamp).toBeInstanceOf(Date);
      expect(result.context.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.context.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('handleQueryError()', () => {
    it('should classify syntax errors correctly', () => {
      const error = new Error('syntax error at or near "SELECT"');
      const result = DatabaseErrorHandler.handleQueryError(error, 'SELECT * FROM users');

      expect(result.type).toBe('query_failed');
      expect(result.suggestion).toContain('syntax error');
    });

    it('should classify constraint violations correctly', () => {
      const error = new Error('duplicate key value violates unique constraint');
      const result = DatabaseErrorHandler.handleQueryError(error);

      expect(result.type).toBe('query_failed');
      expect(result.suggestion).toContain('unique constraint');
    });

    it('should classify foreign key violations correctly', () => {
      const error = new Error('insert or update on table violates foreign key constraint');
      const result = DatabaseErrorHandler.handleQueryError(error);

      expect(result.type).toBe('query_failed');
      expect(result.suggestion).toContain('foreign key');
    });

    it('should classify permission denied errors correctly', () => {
      const error = new Error('permission denied for table users');
      const result = DatabaseErrorHandler.handleQueryError(error);

      expect(result.type).toBe('query_failed');
      expect(result.suggestion).toContain('permission');
    });

    it('should classify missing table errors correctly', () => {
      const error = new Error('relation "users" does not exist');
      const result = DatabaseErrorHandler.handleQueryError(error);

      expect(result.type).toBe('query_failed');
      expect(result.suggestion).toContain('table');
    });
  });

  describe('sanitizeError()', () => {
    it('should remove passwords from error messages', () => {
      const error: DatabaseError = {
        type: 'connection_failed',
        message: 'Failed to connect to postgresql://user:password123@localhost:5432/db',
        context: {
          operation: 'connection',
          timestamp: new Date(),
        },
      };

      const sanitized = DatabaseErrorHandler.sanitizeError(error);

      expect(sanitized.message).not.toContain('password123');
      expect(sanitized.message).toContain('***');
    });

    it('should remove passwords from suggestions', () => {
      const error: DatabaseError = {
        type: 'connection_failed',
        message: 'Connection failed',
        suggestion: 'Check password=secret123 in your connection string',
        context: {
          operation: 'connection',
          timestamp: new Date(),
        },
      };

      const sanitized = DatabaseErrorHandler.sanitizeError(error);

      expect(sanitized.suggestion).not.toContain('secret123');
      expect(sanitized.suggestion).toContain('***');
    });

    it('should remove original error to prevent data leakage', () => {
      const error: DatabaseError = {
        type: 'connection_failed',
        message: 'Connection failed',
        originalError: new Error('Some sensitive error'),
        context: {
          operation: 'connection',
          timestamp: new Date(),
        },
      };

      const sanitized = DatabaseErrorHandler.sanitizeError(error);

      expect(sanitized.originalError).toBeUndefined();
    });

    it('should preserve error type and context', () => {
      const error: DatabaseError = {
        type: 'connection_failed',
        message: 'Connection failed',
        context: {
          operation: 'test_operation',
          timestamp: new Date(),
        },
      };

      const sanitized = DatabaseErrorHandler.sanitizeError(error);

      expect(sanitized.type).toBe(error.type);
      expect(sanitized.context.operation).toBe(error.context.operation);
      expect(sanitized.context.timestamp).toBe(error.context.timestamp);
    });

    /**
     * Property 4: Sensitive Data Sanitization
     * 
     * For any connection string containing a password, the sanitized version
     * for logging SHALL NOT contain the password but SHALL contain all other
     * connection parameters (host, port, database, username).
     * 
     * Validates: Requirements 5.5, 6.5
     */
    it('should sanitize passwords while preserving other parameters (Property 4)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 4, maxLength: 6 }).filter(s => /^[a-z]+$/.test(s)),
          fc.string({ minLength: 4, maxLength: 6 }).filter(s => /^[a-z0-9]+$/.test(s)),
          fc.string({ minLength: 4, maxLength: 6 }).filter(s => /^[a-z]+$/.test(s)),
          fc.integer({ min: 5000, max: 9999 }),
          fc.string({ minLength: 4, maxLength: 6 }).filter(s => /^[a-z]+$/.test(s)),
          (username: string, password: string, host: string, port: number, database: string) => {
            // Ensure no parameter is a substring of another to avoid false positives
            const params = [username, password, host, database];
            for (let i = 0; i < params.length; i++) {
              for (let j = 0; j < params.length; j++) {
                if (i !== j && params[j].includes(params[i])) {
                  return true; // Skip this case
                }
              }
            }

            const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
            const error: DatabaseError = {
              type: 'connection_failed',
              message: `Failed to connect to ${connectionString}`,
              context: {
                operation: 'connection',
                timestamp: new Date(),
              },
            };

            const sanitized = DatabaseErrorHandler.sanitizeError(error);

            // Password should be removed
            const hasPassword = sanitized.message.includes(password);
            // Other parameters should be preserved
            const hasHost = sanitized.message.includes(host);
            const hasPort = sanitized.message.includes(port.toString());
            const hasDatabase = sanitized.message.includes(database);

            return !hasPassword && hasHost && hasPort && hasDatabase;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getSuggestion()', () => {
    it('should return suggestion from error if available', () => {
      const error: DatabaseError = {
        type: 'connection_failed',
        message: 'Connection failed',
        suggestion: 'Custom suggestion',
        context: {
          operation: 'connection',
          timestamp: new Date(),
        },
      };

      const suggestion = DatabaseErrorHandler.getSuggestion(error);

      expect(suggestion).toBe('Custom suggestion');
    });

    it('should provide generic suggestion for connection_failed', () => {
      const error: DatabaseError = {
        type: 'connection_failed',
        message: 'Connection failed',
        context: {
          operation: 'connection',
          timestamp: new Date(),
        },
      };

      const suggestion = DatabaseErrorHandler.getSuggestion(error);

      expect(suggestion).toContain('database');
      expect(suggestion).toContain('DATABASE_URL');
    });

    it('should provide generic suggestion for timeout', () => {
      const error: DatabaseError = {
        type: 'timeout',
        message: 'Operation timed out',
        context: {
          operation: 'query',
          timestamp: new Date(),
        },
      };

      const suggestion = DatabaseErrorHandler.getSuggestion(error);

      expect(suggestion).toContain('timeout');
    });

    it('should provide generic suggestion for query_failed', () => {
      const error: DatabaseError = {
        type: 'query_failed',
        message: 'Query failed',
        context: {
          operation: 'query',
          timestamp: new Date(),
        },
      };

      const suggestion = DatabaseErrorHandler.getSuggestion(error);

      expect(suggestion).toContain('query');
    });

    it('should provide generic suggestion for schema_mismatch', () => {
      const error: DatabaseError = {
        type: 'schema_mismatch',
        message: 'Schema mismatch',
        context: {
          operation: 'validation',
          timestamp: new Date(),
        },
      };

      const suggestion = DatabaseErrorHandler.getSuggestion(error);

      expect(suggestion).toContain('migration');
    });

    it('should provide generic suggestion for invalid_config', () => {
      const error: DatabaseError = {
        type: 'invalid_config',
        message: 'Invalid config',
        context: {
          operation: 'initialization',
          timestamp: new Date(),
        },
      };

      const suggestion = DatabaseErrorHandler.getSuggestion(error);

      expect(suggestion).toContain('DATABASE_URL');
    });
  });
});
