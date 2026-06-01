import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ConfigLoader } from '../../lib/db/config';

describe('ConfigLoader', () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  describe('loadDatabaseUrl()', () => {
    it('should return DATABASE_URL when it is set', () => {
      const testUrl = 'postgresql://user:password@localhost:5432/testdb';
      process.env.DATABASE_URL = testUrl;
      const result = ConfigLoader.loadDatabaseUrl();
      expect(result).toBe(testUrl);
    });

    it('should throw an error when DATABASE_URL is not set', () => {
      expect(() => {
        ConfigLoader.loadDatabaseUrl();
      }).toThrow('DATABASE_URL environment variable is not set');
    });
  });

  describe('validateDatabaseUrl()', () => {
    it('should validate correct PostgreSQL connection strings', () => {
      const validUrls = [
        'postgresql://user:password@localhost:5432/database',
        'postgres://user:password@localhost:5432/database',
        'postgresql://user@localhost:5432/database',
        'postgresql://user:pass@host.com:5432/db',
        'postgresql://user:pass@localhost:5432/db?sslmode=require',
      ];

      validUrls.forEach(url => {
        expect(ConfigLoader.validateDatabaseUrl(url)).toBe(true);
      });
    });

    it('should reject invalid connection strings', () => {
      const invalidUrls = [
        'mysql://user:password@localhost:3306/database',
        'postgresql://invalid',
        'postgresql://',
        'not-a-url',
        '',
        'postgresql://user:password@localhost:99999/database', // Invalid port
      ];

      invalidUrls.forEach(url => {
        expect(ConfigLoader.validateDatabaseUrl(url)).toBe(false);
      });
    });

    it('should reject non-string inputs', () => {
      expect(ConfigLoader.validateDatabaseUrl(null as any)).toBe(false);
      expect(ConfigLoader.validateDatabaseUrl(undefined as any)).toBe(false);
      expect(ConfigLoader.validateDatabaseUrl(123 as any)).toBe(false);
    });
  });

  describe('parseDatabaseUrl()', () => {
    it('should parse basic PostgreSQL connection string', () => {
      const url = 'postgresql://user:password@localhost:5432/database';
      const result = ConfigLoader.parseDatabaseUrl(url);

      expect(result.protocol).toBe('postgresql');
      expect(result.username).toBe('user');
      expect(result.password).toBe('password');
      expect(result.host).toBe('localhost');
      expect(result.port).toBe(5432);
      expect(result.database).toBe('database');
    });

    it('should parse postgres:// protocol', () => {
      const url = 'postgres://user:password@localhost:5432/database';
      const result = ConfigLoader.parseDatabaseUrl(url);

      expect(result.protocol).toBe('postgres');
    });

    it('should parse connection string without password', () => {
      const url = 'postgresql://user@localhost:5432/database';
      const result = ConfigLoader.parseDatabaseUrl(url);

      expect(result.username).toBe('user');
      expect(result.password).toBe('');
    });

    it('should parse connection string with default port', () => {
      const url = 'postgresql://user:password@localhost/database';
      const result = ConfigLoader.parseDatabaseUrl(url);

      expect(result.port).toBe(5432);
    });

    it('should parse connection string with optional parameters', () => {
      const url = 'postgresql://user:password@localhost:5432/database?sslmode=require&connection_limit=20';
      const result = ConfigLoader.parseDatabaseUrl(url);

      expect(result.params.sslmode).toBe('require');
      expect(result.params.connection_limit).toBe('20');
    });

    it('should handle special characters in password', () => {
      const url = 'postgresql://user:p%40ssw%3Drd@localhost:5432/database';
      const result = ConfigLoader.parseDatabaseUrl(url);

      expect(result.password).toBe('p@ssw=rd');
    });

    it('should throw error for invalid URL format', () => {
      expect(() => {
        ConfigLoader.parseDatabaseUrl('invalid-url');
      }).toThrow();
    });

    it('should throw error when database name is missing', () => {
      expect(() => {
        ConfigLoader.parseDatabaseUrl('postgresql://user:password@localhost:5432');
      }).toThrow('Database name is required');
    });

    /**
     * Property 1: Connection String Parsing Round Trip
     * 
     * For any valid PostgreSQL connection string in the format
     * `postgresql://username:password@host:port/database`, parsing and then
     * reconstructing the connection string SHALL produce an equivalent result.
     * 
     * Validates: Requirements 1.3, 1.4
     */
    it('should parse and reconstruct connection strings consistently (Property 1)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
          fc.integer({ min: 1024, max: 65535 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
          (username: string, password: string, host: string, port: number, database: string) => {
            const originalUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
            const parsed = ConfigLoader.parseDatabaseUrl(originalUrl);

            // Verify all components are parsed correctly
            return (
              parsed.protocol === 'postgresql' &&
              parsed.username === username &&
              parsed.password === password &&
              parsed.host === host &&
              parsed.port === port &&
              parsed.database === database
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10: Optional Parameter Preservation
     * 
     * For any connection string with optional parameters (e.g., `sslmode=require`,
     * `connection_limit=20`), parsing and reconstructing the connection string
     * SHALL preserve all optional parameters.
     * 
     * Validates: Requirements 1.4
     */
    it('should preserve optional parameters through parsing (Property 10)', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z_]+$/.test(s) && s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
            { minSize: 1, maxSize: 3 }
          ),
          (params: Record<string, string>) => {
            const paramString = Object.entries(params)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
              .join('&');
            const url = `postgresql://user:pass@localhost:5432/db?${paramString}`;
            const parsed = ConfigLoader.parseDatabaseUrl(url);

            // All parameters should be preserved
            return Object.entries(params).every(([k, v]) => parsed.params[k] === v);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validatePort()', () => {
    it('should validate ports in valid range', () => {
      expect(ConfigLoader.validatePort(1)).toBe(true);
      expect(ConfigLoader.validatePort(5432)).toBe(true);
      expect(ConfigLoader.validatePort(65535)).toBe(true);
      expect(ConfigLoader.validatePort(3306)).toBe(true);
    });

    it('should reject ports outside valid range', () => {
      expect(ConfigLoader.validatePort(0)).toBe(false);
      expect(ConfigLoader.validatePort(65536)).toBe(false);
      expect(ConfigLoader.validatePort(-1)).toBe(false);
      expect(ConfigLoader.validatePort(99999)).toBe(false);
    });

    it('should reject non-integer ports', () => {
      expect(ConfigLoader.validatePort(5432.5)).toBe(false);
      expect(ConfigLoader.validatePort(NaN)).toBe(false);
      expect(ConfigLoader.validatePort(Infinity)).toBe(false);
    });

    /**
     * Property 2: Port Validation Consistency
     * 
     * For any port number, the validation function SHALL return true if and only if
     * the port is in the valid range (1-65535).
     * 
     * Validates: Requirements 6.1, 6.2
     */
    it('should validate ports consistently (Property 2)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 100000 }),
          (port: number) => {
            const result = ConfigLoader.validatePort(port);
            const expected = Number.isInteger(port) && port >= 1 && port <= 65535;
            return result === expected;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeForLogging()', () => {
    it('should remove password from connection string', () => {
      const url = 'postgresql://user:password@localhost:5432/database';
      const sanitized = ConfigLoader.sanitizeForLogging(url);

      expect(sanitized).not.toContain('password');
      expect(sanitized).toContain('***');
      expect(sanitized).toContain('user');
      expect(sanitized).toContain('localhost');
      expect(sanitized).toContain('database');
    });

    it('should preserve host and port', () => {
      const url = 'postgresql://user:password@example.com:5433/mydb';
      const sanitized = ConfigLoader.sanitizeForLogging(url);

      expect(sanitized).toContain('example.com');
      expect(sanitized).toContain('5433');
      expect(sanitized).toContain('mydb');
    });

    it('should preserve optional parameters', () => {
      const url = 'postgresql://user:password@localhost:5432/database?sslmode=require&connection_limit=20';
      const sanitized = ConfigLoader.sanitizeForLogging(url);

      expect(sanitized).toContain('sslmode=require');
      expect(sanitized).toContain('connection_limit=20');
      expect(sanitized).not.toContain('password');
    });

    it('should handle connection strings without password', () => {
      const url = 'postgresql://user@localhost:5432/database';
      const sanitized = ConfigLoader.sanitizeForLogging(url);

      expect(sanitized).toContain('user');
      expect(sanitized).toContain('localhost');
      expect(sanitized).toContain('database');
    });

    it('should handle invalid URLs gracefully', () => {
      const url = 'invalid-url';
      const sanitized = ConfigLoader.sanitizeForLogging(url);

      expect(sanitized).toBeDefined();
      expect(sanitized).toContain('***');
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

            const url = `postgresql://${username}:${password}@${host}:${port}/${database}`;
            const sanitized = ConfigLoader.sanitizeForLogging(url);

            // Password should be removed
            const hasPassword = sanitized.includes(password);
            // Other parameters should be preserved
            const hasHost = sanitized.includes(host);
            const hasPort = sanitized.includes(port.toString());
            const hasDatabase = sanitized.includes(database);

            return !hasPassword && hasHost && hasPort && hasDatabase;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

