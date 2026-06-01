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
        database: dbStatus,
      },
      { status: statusCode }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: `Health check failed: ${errorMessage}`,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          poolSize: 0,
          activeConnections: 0,
          idleConnections: 0,
          lastError: errorMessage,
          lastErrorTime: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
