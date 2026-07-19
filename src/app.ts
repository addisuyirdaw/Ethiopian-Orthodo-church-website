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
  // Normalize Content-Type charset to a lowercase form to avoid
  // `UnsupportedMediaTypeError: unsupported charset "UTF-8"` thrown by
  // body-parser when clients send uppercased charset tokens.
  app.use((req: Request, _res, next) => {
    const ct = req.headers['content-type'];
    if (typeof ct === 'string' && /charset=/.test(ct)) {
      // only change the charset token casing (UTF-8 -> utf-8)
      req.headers['content-type'] = ct.replace(/charset=UTF-8/i, (m) => m.toLowerCase());
    }
    next();
  });

  app.use(
    express.json({
      verify: (req: Request, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(localeMiddleware);

  // Serve Vite-built frontend static files from /public
  // process.cwd() is /var/task on Vercel, which is where includeFiles places public/**
  app.use(express.static(path.join(process.cwd(), 'public'), { index: 'index.html' }));


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
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB health check timed out after 5 s')), 5000)
    );
    try {
      const count = await Promise.race([prisma.institution.count(), timeout]);
      if (count === 0) {
        res.status(200).json({ status: 'pending', service: 'OrthodoxConnect API', message: 'Seeding pending.' });
        return;
      }
      res.status(200).json({ status: 'ok', service: 'OrthodoxConnect API' });
    } catch (err: any) {
      res.status(200).json({ status: 'pending', service: 'OrthodoxConnect API', error: err.message || String(err) });
    }
  });

  // Temporary route to debug which files are actually copied to the Vercel deployment folder
  app.get('/debug-files', (_req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const publicPath = path.join(process.cwd(), 'public');
      const assetsPath = path.join(publicPath, 'assets');
      
      const publicFiles = fs.readdirSync(publicPath);
      let assetsFiles = [];
      try {
        assetsFiles = fs.readdirSync(assetsPath);
      } catch (e: any) {
        assetsFiles = ['Error: ' + e.message];
      }
      
      res.status(200).json({
        cwd: process.cwd(),
        publicFiles,
        assetsFiles
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/api/v1', apiRoutes);

  // SPA catch-all — serve index.html for any route not matched above
  // This allows React Router to handle client-side navigation
  app.get('*', (_req: Request, res: Response) => {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    res.sendFile(indexPath);
  });

  app.use(errorHandler);

  return app;
}

export default createApp;
