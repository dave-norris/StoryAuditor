/**
 * Database Status Component
 * 
 * Server component that displays the current database connection status
 * on the main page.
 */

import { checkDatabaseHealth, getDatabaseStatus } from '@/lib/db';

interface StatusIndicatorProps {
  status: 'healthy' | 'unhealthy' | 'timeout';
  message: string;
  responseTime: number;
}

function StatusIndicator({ status, message, responseTime }: StatusIndicatorProps) {
  const statusConfig = {
    healthy: {
      color: '#10b981',
      bgColor: '#ecfdf5',
      label: '✓ Connected',
      textColor: '#047857',
    },
    unhealthy: {
      color: '#ef4444',
      bgColor: '#fef2f2',
      label: '✗ Disconnected',
      textColor: '#991b1b',
    },
    timeout: {
      color: '#f59e0b',
      bgColor: '#fffbeb',
      label: '⚠ Timeout',
      textColor: '#92400e',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      style={{
        backgroundColor: config.bgColor,
        border: `2px solid ${config.color}`,
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: config.color,
          }}
        />
        <span
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: config.textColor,
          }}
        >
          Database Status: {config.label}
        </span>
      </div>
      <p
        style={{
          margin: '8px 0 0 0',
          color: config.textColor,
          fontSize: '14px',
        }}
      >
        {message}
      </p>
      {responseTime > 0 && (
        <p
          style={{
            margin: '4px 0 0 0',
            color: config.textColor,
            fontSize: '12px',
            opacity: 0.8,
          }}
        >
          Response time: {responseTime}ms
        </p>
      )}
    </div>
  );
}

export async function DatabaseStatus() {
  try {
    const healthResult = await checkDatabaseHealth();
    const dbStatus = await getDatabaseStatus();

    return (
      <StatusIndicator
        status={healthResult.status}
        message={healthResult.message}
        responseTime={healthResult.responseTime}
      />
    );
  } catch (error) {
    return (
      <StatusIndicator
        status="unhealthy"
        message="Unable to check database status"
        responseTime={0}
      />
    );
  }
}
