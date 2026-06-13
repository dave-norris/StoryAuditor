/**
 * Database utilities using node-postgres (pg)
 * 
 * Provides a singleton Pool instance with proper connection management
 */

import { Pool, PoolClient } from 'pg';

// Singleton pattern to avoid multiple Pool instances
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Handle graceful shutdown
    if (typeof window === 'undefined') {
      process.on('SIGINT', async () => {
        await disconnectDatabase();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    }
  }

  return pool;
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
  idleConnections: number;
  lastError: string | null;
  lastErrorTime: string | null;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
        timestamp,
      };
    } finally {
      client.release();
    }
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');

      return {
        connected: true,
        poolSize: pool.options.max || 20,
        activeConnections: pool.totalCount - pool.idleCount,
        idleConnections: pool.idleCount,
        lastError: null,
        lastErrorTime: null,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      connected: false,
      poolSize: 20,
      activeConnections: 0,
      idleConnections: 0,
      lastError: errorMessage,
      lastErrorTime: new Date().toISOString(),
    };
  }
}

/**
 * Execute a query
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Get a client for transaction support
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Execute a callback within a transaction that sets the RLS user context.
 * 
 * Acquires a client, begins a transaction, sets `app.current_user_id` via
 * SET LOCAL (scoped to the transaction), executes the callback, commits on
 * success, rolls back on error, and always releases the client.
 */
export async function withUserTransaction<T>(
  internalUserId: number,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.current_user_id', $1, true)`,
      [internalUserId.toString()]
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Disconnect from database (for cleanup)
 */
export async function disconnectDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
