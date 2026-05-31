// Interface for server info response
interface ServerInfo {
  name: string;
  version: string;
  description: string;
  features: string[];
  uptime: number;
  timestamp: string;
  environment: string;
}

// Fetch server information from the backend
async function fetchServerInfo(): Promise<void> {
  const serverDetailsDiv = document.getElementById('server-details');
  
  if (!serverDetailsDiv) return;
  
  try {
    serverDetailsDiv.innerHTML = '<p class="loading">Loading server information...</p>';
    
    console.log('Fetching server info from /api/server-info...');
    const response = await fetch('/api/server-info');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ServerInfo = await response.json();
    console.log('Server data received:', data);
    
    // Format the server info for display
    let html = `
      <p><strong>Server Name:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Version:</strong> ${escapeHtml(data.version)}</p>
      <p><strong>Description:</strong> ${escapeHtml(data.description)}</p>
      <p><strong>Environment:</strong> ${escapeHtml(data.environment)}</p>
      <p><strong>Uptime:</strong> ${formatUptime(data.uptime)}</p>
      <p><strong>Last Updated:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
      <p><strong>Features:</strong></p>
      <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
    `;
    
    data.features.forEach((feature: string) => {
      html += `<li>• ${escapeHtml(feature)}</li>`;
    });
    
    html += '</ul>';
    
    serverDetailsDiv.innerHTML = html;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    serverDetailsDiv.innerHTML = `
      <p style="color: #ef4444;">
        <strong>Error:</strong> Unable to fetch server information. 
        Make sure the backend server is running on http://localhost:3000
      </p>
      <p style="color: #94a3b8; margin-top: 1rem;">
        Error details: ${escapeHtml(errorMessage)}
      </p>
    `;
  }
}

// Format uptime in a readable way
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char: string) => map[char]);
}

// Smooth scroll to server info section
function scrollToServerInfo(): void {
  const serverInfoSection = document.getElementById('server-info');
  if (serverInfoSection) {
    serverInfoSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Fetch server info when the page loads
document.addEventListener('DOMContentLoaded', (): void => {
  console.log('DOM loaded, fetching server info...');
  fetchServerInfo();
});

// Also try to fetch immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', (): void => {
    fetchServerInfo();
  });
} else {
  // DOM is already loaded
  console.log('DOM already loaded, fetching server info immediately...');
  fetchServerInfo();
}
