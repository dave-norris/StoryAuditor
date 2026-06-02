'use client';

import { useEffect, useState } from 'react';

interface VersionData {
  version: string;
  lastUpdated: string;
}

export function VersionFooter() {
  const [versionData, setVersionData] = useState<VersionData | null>(null);

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const response = await fetch('/version.json');
        const data = await response.json();
        setVersionData(data);
      } catch (error) {
        console.error('Failed to load version:', error);
      }
    };

    loadVersion();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <footer style={{
      textAlign: 'center',
      padding: '16px',
      fontSize: '12px',
      color: '#999',
      marginTop: 'auto',
      borderTop: '1px solid #eee'
    }}>
      {versionData ? (
        <>
          v{versionData.version} • Updated {formatDate(versionData.lastUpdated)}
        </>
      ) : (
        'Loading version...'
      )}
    </footer>
  );
}
