/**
 * Health Check Service
 * 
 * This module provides health check functionality for the database connection,
 * including timeout handling and response time measurement.
 */

import { PrismaClient } from '@prisma/client';
import { HealthCheckResult } from './types';
import { DatabaseErrorHandler } from './error-handler';
import { DatabaseLogger } from './logger';

/**
 * HealthCheckService class
 * 
 * Provides methods to perform health checks on the database connection,
 * with configurable timeout and response time measurement.
 */
export class HealthCheckService {
  private timeout: number;
  private prisma: PrismaClient;

  /**
   * Constructor
   * 
   * Initializes the health check service with a Prisma Client instance
   * and optional timeout configuration.
   * 
   * @param prisma - The Prisma Client instance
   * @param timeout - Optional timeout in milliseconds (default: 5000)
   */
  constructor(prisma: PrismaClient, timeout: number = 5000) {
    this.prisma = prisma;
    this.timeout = timeout;
  }

  /**
   * Perform a health check
   * 
   * Executes a simple SELECT 1 query with timeout handling.
   * Returns a HealthCheckResult with status, message, and response time.
   * Timeout errors take precedence over other failures.
   * 
   * @returns HealthCheckResult with status and timing information
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      DatabaseLogger.debug(
        'HealthCheckService',
        'health_check',
        `Starting health check with ${this.timeout}ms timeout`
      );

      // Execute the health check query with timeout
      await this.withTimeout(
        this.executeHealthCheckQuery(),
        this.timeout
      );

      const responseTime = Date.now() - startTime;

      DatabaseLogger.info(
        'HealthCheckService',
        'health_check',
        'Health check passed',
        { responseTime }
      );

      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        responseTime,
        timestamp,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Check if this is a timeout error
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('timed out'))) {
        DatabaseLogger.warn(
          'HealthCheckService',
          'health_check',
          'Health check timed out',
          { responseTime, timeout: this.timeout }
        );

        return {
          status: 'timeout',
          message: `Health check exceeded timeout of ${this.timeout}ms`,
          responseTime,
          timestamp,
        };
      }

      // Handle other errors
      const dbError = DatabaseErrorHandler.handleConnectionError(
        error instanceof Error ? error : new Error(String(error)),
        'health_check'
      );

      DatabaseLogger.error(
        'HealthCheckService',
        'health_check',
        'Health check failed',
        error instanceof Error ? error : new Error(String(error)),
        { responseTime }
      );

      return {
        status: 'unhealthy',
        message: dbError.message,
        responseTime,
        timestamp,
      };
    }
  }

  /**
   * Execute the health check query
   * 
   * Runs a simple SELECT 1 query to verify database connectivity.
   * Throws an error on failure.
   * 
   * @returns Promise that resolves on success
   * @throws Error if the query fails
   */
  private async executeHealthCheckQuery(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Wrap a promise with timeout logic
   * 
   * Executes a promise and throws a timeout error if it exceeds
   * the specified timeout duration.
   * 
   * @param promise - The promise to wrap
   * @param timeoutMs - The timeout duration in milliseconds
   * @returns The result of the promise if it completes in time
   * @throws Error if the promise exceeds the timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }
}
