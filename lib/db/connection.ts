/**
 * Database Connection Manager
 * 
 * This module provides the core connection management functionality,
 * including Prisma Client initialization, connection pool management,
 * and reconnection logic with exponential backoff.
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseConfig, ConnectionStatus } from './types';
import { ConfigLoader } from './config';
import { DatabaseErrorHandler } from './error-handler';
import { DatabaseLogger } from './logger';

/**
 * DatabaseConnectionManager class
 * 
 * Manages the lifecycle of database connections, including initialization,
 * status tracking, and automatic reconnection with exponential backoff.
 */
export class DatabaseConnectionManager {
  private prisma: PrismaClient | null = null;
  private config: DatabaseConfig;
  private status: ConnectionStatus;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isInitializing: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Constructor
   * 
   * Initializes the connection manager with the provided configuration.
   * 
   * @param config - Database configuration
   */
  constructor(config: DatabaseConfig) {
    this.config = config;
    this.status = {
      connected: false,
      poolSize: config.poolSize || 2,
      activeConnections: 0,
    };
  }

/**
 * Initialize the database connection
 * 
 * Loads the DATABASE_URL, validates it, and initializes the Prisma Client
 * with appropriate connection pool settings.
 * 
 * Note: If initialization fails, the application continues running without
 * database access. This allows the app to start even if the database is unavailable.
 */
async initialize(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.isInitializing) {
      if (this.initializationPromise) {
        return this.initializationPromise;
      }
    }

    this.isInitializing = true;

    try {
      this.initializationPromise = this.performInitialization();
      await this.initializationPromise;
    } catch (error) {
      // Log the error but don't throw - allow app to continue without database
      DatabaseLogger.warn(
        'DatabaseConnectionManager',
        'initialization',
        'Database initialization failed, but application will continue',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  /**
   * Perform the actual initialization
   * 
   * @private
   */
  private async performInitialization(): Promise<void> {
    try {
      // Load and validate DATABASE_URL
      const url = ConfigLoader.loadDatabaseUrl();

      DatabaseLogger.debug(
        'DatabaseConnectionManager',
        'initialization',
        'Loaded DATABASE_URL from environment'
      );

      if (!ConfigLoader.validateDatabaseUrl(url)) {
        throw new Error(
          'DATABASE_URL format is invalid. ' +
          'Expected format: postgresql://username:password@host:port/database or prisma+postgres://...'
        );
      }

      DatabaseLogger.debug(
        'DatabaseConnectionManager',
        'initialization',
        'DATABASE_URL format is valid',
        { url: ConfigLoader.sanitizeForLogging(url) }
      );

      // Update config with loaded URL
      this.config.url = url;

      // Initialize Prisma Client
      // For Prisma v7, the DATABASE_URL is read from environment variables automatically
      // via the prisma.config.ts file
      this.prisma = new PrismaClient({});

      DatabaseLogger.debug(
        'DatabaseConnectionManager',
        'initialization',
        'Prisma Client initialized'
      );

      // Test the connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Update status
      this.status.connected = true;
      this.reconnectAttempts = 0;

      DatabaseLogger.info(
        'DatabaseConnectionManager',
        'initialization',
        'Database connection established successfully',
        { url: ConfigLoader.sanitizeForLogging(url) }
      );
    } catch (error) {
      this.status.connected = false;
      const dbError = DatabaseErrorHandler.handleConnectionError(
        error instanceof Error ? error : new Error(String(error)),
        'initialization'
      );
      this.status.lastError = dbError.message;
      this.status.lastErrorTime = new Date();

      DatabaseLogger.error(
        'DatabaseConnectionManager',
        'initialization',
        'Failed to initialize database connection',
        error instanceof Error ? error : new Error(String(error)),
        { suggestion: dbError.suggestion }
      );

      throw error;
    }
  }

  /**
   * Get current connection status
   * 
   * Returns the current status of the database connection,
   * including pool size and error information.
   * 
   * @returns Current ConnectionStatus
   */
  async getStatus(): Promise<ConnectionStatus> {
    if (this.prisma && this.status.connected) {
      try {
        // Try to get connection info
        const result = await this.prisma.$queryRaw`SELECT 1`;
        this.status.connected = true;
        this.status.activeConnections = 1; // Simplified for now
      } catch (error) {
        this.status.connected = false;
        const dbError = DatabaseErrorHandler.handleConnectionError(
          error instanceof Error ? error : new Error(String(error)),
          'status_check'
        );
        this.status.lastError = dbError.message;
        this.status.lastErrorTime = new Date();
      }
    }

    return { ...this.status };
  }

  /**
   * Attempt to reconnect to the database
   * 
   * Implements exponential backoff with up to 3 reconnection attempts.
   * Waits 100ms before attempt 2 and 200ms before attempt 3.
   * 
   * @returns true if reconnection succeeded, false otherwise
   */
  async reconnect(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.status.lastError = 'Maximum reconnection attempts exceeded';
      this.status.lastErrorTime = new Date();

      DatabaseLogger.critical(
        'DatabaseConnectionManager',
        'reconnection',
        'Maximum reconnection attempts exceeded',
        undefined,
        { attempts: this.reconnectAttempts }
      );

      return false;
    }

    this.reconnectAttempts++;

    try {
      // Calculate backoff delay
      const delay = this.reconnectAttempts === 1 ? 0 : (this.reconnectAttempts - 1) * 100;

      DatabaseLogger.info(
        'DatabaseConnectionManager',
        'reconnection',
        `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
        { delay }
      );

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Attempt to reconnect
      if (!this.prisma) {
        await this.initialize();
      } else {
        // Test existing connection
        await this.prisma.$queryRaw`SELECT 1`;
      }

      this.status.connected = true;
      this.reconnectAttempts = 0;

      DatabaseLogger.info(
        'DatabaseConnectionManager',
        'reconnection',
        'Reconnection successful',
        { attempts: this.reconnectAttempts }
      );

      return true;
    } catch (error) {
      const dbError = DatabaseErrorHandler.handleConnectionError(
        error instanceof Error ? error : new Error(String(error)),
        `reconnection_attempt_${this.reconnectAttempts}`
      );
      this.status.lastError = dbError.message;
      this.status.lastErrorTime = new Date();

      DatabaseLogger.warn(
        'DatabaseConnectionManager',
        'reconnection',
        `Reconnection attempt ${this.reconnectAttempts} failed`,
        error instanceof Error ? error : new Error(String(error)),
        { attempt: this.reconnectAttempts, maxAttempts: this.maxReconnectAttempts }
      );

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.status.connected = false;
      }

      return false;
    }
  }

  /**
   * Disconnect from the database
   * 
   * Closes the Prisma Client connection pool and cleans up resources.
   */
  async disconnect(): Promise<void> {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.prisma = null;
        this.status.connected = false;

        DatabaseLogger.info(
          'DatabaseConnectionManager',
          'disconnection',
          'Database connection closed successfully'
        );
      } catch (error) {
        const dbError = DatabaseErrorHandler.handleConnectionError(
          error instanceof Error ? error : new Error(String(error)),
          'disconnection'
        );
        this.status.lastError = dbError.message;
        this.status.lastErrorTime = new Date();

        DatabaseLogger.error(
          'DatabaseConnectionManager',
          'disconnection',
          'Error during disconnection',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Get the Prisma Client instance
   * 
   * Returns the initialized Prisma Client for executing queries.
   * 
   * @returns PrismaClient instance
   * @throws Error if not initialized
   */
  getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error(
        'Prisma Client is not initialized. ' +
        'Call initialize() before accessing the client.'
      );
    }
    return this.prisma;
  }

  /**
   * Check if the connection is active
   * 
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.status.connected;
  }
}
