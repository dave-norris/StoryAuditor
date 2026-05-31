import express, { Express, Request, Response } from 'express';
import path from 'path';

const app: Express = express();
const PORT: number = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

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

// API endpoint to get server info
app.get('/api/server-info', (req: Request, res: Response<ServerInfo>): void => {
  const serverInfo: ServerInfo = {
    name: 'Story Auditor Backend',
    version: '1.0.0',
    description: 'A powerful backend server for analyzing and auditing story content',
    features: [
      'Real-time story analysis',
      'Content validation and verification',
      'Performance metrics and reporting',
      'RESTful API architecture',
      'Built with Express.js and TypeScript'
    ],
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  res.json(serverInfo);
});

// Health check endpoint
interface HealthStatus {
  status: string;
  timestamp: string;
}

app.get('/api/health', (req: Request, res: Response<HealthStatus>): void => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the landing page
app.get('/', (req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, (): void => {
  console.log(`Story Auditor server is running on http://localhost:${PORT}`);
});
