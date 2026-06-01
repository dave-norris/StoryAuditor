/**
 * Database Configuration Loader
 * 
 * This module provides utilities for loading, validating, and parsing
 * the DATABASE_URL environment variable, including connection string
 * validation and sensitive data sanitization.
 */

import { ParsedDatabaseUrl } from './types';

/**
 * ConfigLoader class
 * 
 * Provides static methods for loading and validating database configuration
 * from environment variables, with support for parsing connection strings
 * and sanitizing sensitive information.
 */
export class ConfigLoader {
  /**
   * Load DATABASE_URL from environment variables
   * 
   * Reads the DATABASE_URL environment variable and returns it.
   * Throws an error if the variable is not set.
   * 
   * @returns The DATABASE_URL value
   * @throws Error if DATABASE_URL is not set
   */
  static loadDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    
    if (!url) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please configure it in your .env file with a valid PostgreSQL connection string.'
      );
    }
    
    return url;
  }

  /**
   * Validate DATABASE_URL format
   * 
   * Checks if the provided URL follows the PostgreSQL connection string format:
   * postgresql://username:password@host:port/database
   * 
   * @param url - The connection string to validate
   * @returns true if the URL is valid, false otherwise
   */
  static validateDatabaseUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Support standard postgresql:// and postgres:// formats
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      return false;
    }

    try {
      // Try to parse the URL to validate its structure
      const parsed = this.parseDatabaseUrl(url);
      
      // Validate required components
      if (!parsed.protocol || !parsed.host) {
        return false;
      }

      // Validate port
      if (!this.validatePort(parsed.port)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse DATABASE_URL into components
   * 
   * Extracts the individual components from a PostgreSQL connection string,
   * including protocol, username, password, host, port, database, and optional parameters.
   * 
   * @param url - The connection string to parse
   * @returns ParsedDatabaseUrl object with all components
   * @throws Error if the URL format is invalid
   */
  static parseDatabaseUrl(url: string): ParsedDatabaseUrl {
    try {
      // Remove the protocol prefix
      let remaining = url;
      let protocol = '';

      if (url.startsWith('postgresql://')) {
        protocol = 'postgresql';
        remaining = url.slice('postgresql://'.length);
      } else if (url.startsWith('postgres://')) {
        protocol = 'postgres';
        remaining = url.slice('postgres://'.length);
      } else {
        throw new Error('Invalid protocol. Expected postgresql:// or postgres://');
      }

      // Extract credentials and host part
      let credentials = '';
      let hostPart = '';
      let params: Record<string, string> = {};

      // Check for query parameters
      const paramIndex = remaining.indexOf('?');
      if (paramIndex !== -1) {
        const paramString = remaining.slice(paramIndex + 1);
        remaining = remaining.slice(0, paramIndex);

        // Parse query parameters
        const paramPairs = paramString.split('&');
        for (const pair of paramPairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }
      }

      // Split credentials from host
      const atIndex = remaining.lastIndexOf('@');
      if (atIndex !== -1) {
        credentials = remaining.slice(0, atIndex);
        hostPart = remaining.slice(atIndex + 1);
      } else {
        hostPart = remaining;
      }

      // Parse credentials
      let username = '';
      let password = '';

      if (credentials) {
        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
          username = decodeURIComponent(credentials.slice(0, colonIndex));
          password = decodeURIComponent(credentials.slice(colonIndex + 1));
        } else {
          username = decodeURIComponent(credentials);
        }
      }

      // Parse host and port
      let host = '';
      let port = 5432; // Default PostgreSQL port

      // Handle IPv6 addresses in brackets
      if (hostPart.startsWith('[')) {
        const bracketIndex = hostPart.indexOf(']');
        if (bracketIndex !== -1) {
          host = hostPart.slice(1, bracketIndex);
          const remainder = hostPart.slice(bracketIndex + 1);
          if (remainder.startsWith(':')) {
            const slashIndex = remainder.indexOf('/');
            const portString = slashIndex === -1 ? remainder.slice(1) : remainder.slice(1, slashIndex);
            port = parseInt(portString, 10);
          }
        }
      } else {
        // Regular hostname or IPv4
        const slashIndex = hostPart.indexOf('/');
        const hostAndPort = slashIndex === -1 ? hostPart : hostPart.slice(0, slashIndex);
        const colonIndex = hostAndPort.lastIndexOf(':');

        if (colonIndex !== -1) {
          // Port is specified
          host = hostAndPort.slice(0, colonIndex);
          const portString = hostAndPort.slice(colonIndex + 1);
          port = parseInt(portString, 10);
        } else {
          // No port specified
          host = hostAndPort;
        }
      }

      // Parse database name
      let database = '';
      const slashIndex = hostPart.indexOf('/');
      if (slashIndex !== -1) {
        database = hostPart.slice(slashIndex + 1);
      }

      if (!database) {
        throw new Error('Database name is required in the connection string');
      }

      return {
        protocol,
        username,
        password,
        host,
        port,
        database,
        params,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse DATABASE_URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate port number
   * 
   * Checks if the provided port number is in the valid range (1-65535).
   * 
   * @param port - The port number to validate
   * @returns true if the port is valid, false otherwise
   */
  static validatePort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * Sanitize connection string for logging
   * 
   * Removes the password from the connection string to prevent
   * sensitive information from being logged.
   * 
   * @param url - The connection string to sanitize
   * @returns Sanitized connection string with password removed
   */
  static sanitizeForLogging(url: string): string {
    try {
      const parsed = this.parseDatabaseUrl(url);

      // Reconstruct URL without password
      let sanitized = `${parsed.protocol}://`;

      if (parsed.username) {
        sanitized += parsed.username;
        // Add a placeholder for password if it exists
        if (parsed.password) {
          sanitized += ':***';
        }
        sanitized += '@';
      }

      sanitized += parsed.host;

      if (parsed.port !== 5432) {
        sanitized += `:${parsed.port}`;
      }

      sanitized += `/${parsed.database}`;

      // Add parameters back
      if (Object.keys(parsed.params).length > 0) {
        const paramPairs = Object.entries(parsed.params).map(
          ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        );
        sanitized += `?${paramPairs.join('&')}`;
      }

      return sanitized;
    } catch {
      // If parsing fails, return a generic sanitized version
      return 'postgresql://***@***/***(password removed)';
    }
  }
}
