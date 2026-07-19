import express, { Application, Request, Response } from 'express';
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

  app.use('/api/v1', apiRoutes);

  app.use(errorHandler);

  return app;
}

export default createApp;
