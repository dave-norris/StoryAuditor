/**
 * Database utilities for health checks and status
 * 
 * Provides a singleton Prisma Client instance with proper connection management
 */

import { PrismaClient } from '@prisma/client';

// Singleton pattern to avoid multiple Prisma Client instances
let prisma: PrismaClient;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error'], // Only log errors in production
    });

    // Handle graceful shutdown
    if (typeof window === 'undefined') {
      process.on('SIGINT', async () => {
        await prisma.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    }
  }

  return prisma;
}

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
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
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
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
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
      message: `Connection failed: ${errorMessage}`,
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
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;

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

/**
 * Disconnect from database (for cleanup)
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

