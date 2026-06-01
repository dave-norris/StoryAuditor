/**
 * Health Check API Endpoint
 * 
 * Provides a REST endpoint to check the database connection status.
 * Can be called from the frontend or monitoring systems.
 */

import { checkDatabaseHealth, getDatabaseStatus } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthResult = await checkDatabaseHealth();
    const dbStatus = await getDatabaseStatus();

    const statusCode = healthResult.status === 'healthy' ? 200 : 503;

    return NextResponse.json(
      {
        status: healthResult.status,
        message: healthResult.message,
        responseTime: healthResult.responseTime,
        timestamp: healthResult.timestamp,
        database: {
          connected: dbStatus.connected,
          poolSize: dbStatus.poolSize,
          activeConnections: dbStatus.activeConnections,
          lastError: dbStatus.lastError,
          lastErrorTime: dbStatus.lastErrorTime,
        },
      },
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Failed to check database health',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
