'use client';

/**
 * Database Status Component
 * 
 * Client component that displays database connection status.
 * Only connects when the "Connect DB" button is clicked.
 */

import { useState } from 'react';

interface StatusIndicatorProps {
  status: 'idle' | 'healthy' | 'unhealthy' | 'loading';
  message: string;
  responseTime: number;
}

function StatusIndicator({ status, message, responseTime }: StatusIndicatorProps) {
  const statusConfig = {
    idle: {
      color: '#6b7280',
      bgColor: '#f3f4f6',
      label: '○ Not Connected',
      textColor: '#374151',
    },
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
    loading: {
      color: '#f59e0b',
      bgColor: '#fffbeb',
      label: '⟳ Connecting...',
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

export function DatabaseStatus() {
  const [status, setStatus] = useState<'idle' | 'healthy' | 'unhealthy' | 'loading'>('idle');
  const [message, setMessage] = useState('Click "Connect DB" to check database connection');
  const [responseTime, setResponseTime] = useState(0);

  const handleConnect = async () => {
    setStatus('loading');
    setMessage('Checking database connection...');
    setResponseTime(0);

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      setStatus(data.status === 'healthy' ? 'healthy' : 'unhealthy');
      setMessage(data.message);
      setResponseTime(data.responseTime);
    } catch (error) {
      setStatus('unhealthy');
      setMessage(error instanceof Error ? error.message : 'Failed to connect');
      setResponseTime(0);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={status === 'loading'}
        style={{
          marginTop: '24px',
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: status === 'loading' ? '#d1d5db' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1,
        }}
      >
        {status === 'loading' ? 'Connecting...' : 'Connect DB'}
      </button>

      {status !== 'idle' && (
        <StatusIndicator
          status={status}
          message={message}
          responseTime={responseTime}
        />
      )}
    </div>
  );
}
