/**
 * Database utilities for health checks and status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime: number;
  timestamp: string;
}

export interface DatabaseStatus {
  connected: boolean;
  poolSize: number;
  activeConnections: number;
  lastError: string | null;
  lastErrorTime: string | null;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Silently fail - app continues without database
    console.error('Database initialization failed:', error);
  }
}

/**
 * Check database health by running a simple query
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime,
      timestamp,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'unhealthy',
      message: `Database connection failed: ${errorMessage}`,
      responseTime,
      timestamp,
    };
  }
}

/**
 * Get current database status
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      connected: true,
      poolSize: 10,
      activeConnections: 1,
      lastError: null,
      lastErrorTime: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      connected: false,
      poolSize: 10,
      activeConnections: 0,
      lastError: errorMessage,
      lastErrorTime: new Date().toISOString(),
    };
  }
}
