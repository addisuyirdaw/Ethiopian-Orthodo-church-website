import express, { Application, Request, Response } from 'express';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error-handler.middleware';
import { localeMiddleware } from './middleware/locale.middleware';
import prisma from './lib/prisma';

// Augment Express Request to carry the raw body Buffer for HMAC verification
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

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

  // Capture the raw request body before JSON parsing so that the clearinghouse
  // webhook route can verify the HMAC-SHA256 signature over the original bytes.
  app.use(
    express.json({
      verify: (req: Request, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(localeMiddleware);

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

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const count = await prisma.institution.count();
      if (count === 0) {
        res.status(200).json({ status: 'pending', service: 'OrthodoxConnect API', message: 'Seeding pending.' });
        return;
      }
      res.status(200).json({ status: 'ok', service: 'OrthodoxConnect API' });
    } catch (err: any) {
      res.status(200).json({ status: 'pending', service: 'OrthodoxConnect API', error: err.message || String(err) });
    }
  });

  app.use('/api/v1', apiRoutes);

  app.use(errorHandler);

  return app;
}

export default createApp;
