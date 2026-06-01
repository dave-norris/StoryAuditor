/**
 * Database Singleton
 * 
 * Provides a single instance of the DatabaseConnectionManager
 * for use throughout the application.
 */

import { DatabaseConnectionManager } from './connection';
import { HealthCheckService } from './health-check';

// Create a singleton instance
let connectionManager: DatabaseConnectionManager | null = null;

/**
 * Get or create the database connection manager
 */
export function getDatabaseManager(): DatabaseConnectionManager {
  if (!connectionManager) {
    connectionManager = new DatabaseConnectionManager({
      url: process.env.DATABASE_URL || '',
      poolSize: 10,
      timeout: 5000,
    });
  }
  return connectionManager;
}

/**
 * Initialize the database connection
 */
export async function initializeDatabase(): Promise<void> {
  const manager = getDatabaseManager();
  try {
    await manager.initialize();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Don't throw - allow app to continue without database
  }
}

/**
 * Get the health check service
 */
export function getHealthCheckService(): HealthCheckService {
  const manager = getDatabaseManager();
  try {
    const prisma = manager.getPrismaClient();
    return new HealthCheckService(prisma, 5000);
  } catch (error) {
    throw new Error('Database not initialized');
  }
}

/**
 * Get current database status
 */
export async function getDatabaseStatus() {
  const manager = getDatabaseManager();
  return manager.getStatus();
}

/**
 * Perform a health check
 */
export async function checkDatabaseHealth() {
  try {
    const healthCheck = getHealthCheckService();
    return await healthCheck.check();
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      message: 'Database not initialized',
      responseTime: 0,
      timestamp: new Date(),
    };
  }
}
