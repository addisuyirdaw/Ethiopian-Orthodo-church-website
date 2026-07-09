import express, { Application, Request, Response } from 'express';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error-handler.middleware';

export function createApp(): Application {
  const app = express();

  // Custom CORS middleware to avoid cross-origin issues during local tests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json());

  // Serve static files from 'public' directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Render index.html at /dashboard
  app.get('/dashboard', (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });

  // Root welcome route redirects or shows API welcome page
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'OrthodoxConnect API',
      version: '1.0.0',
      description: 'Enterprise SaaS Church Management & FinTech platform for Orthodox Christian jurisdictions',
      status: 'online',
      endpoints: {
        dashboard: '/dashboard',
        health: '/health',
        auth: '/api/v1/auth',
        institutions: '/api/v1/institutions',
        sacraments: '/api/v1/sacraments',
        financials: '/api/v1/financials',
        calendar: '/api/v1/calendar',
      },
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'OrthodoxConnect API' });
  });

  app.use('/api/v1', apiRoutes);

  app.use(errorHandler);

  return app;
}

export default createApp;
