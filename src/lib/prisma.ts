import { PrismaClient } from '@prisma/client';

// In serverless environments (Vercel), each function invocation may create a new
// PrismaClient. We cache it on globalThis to reuse across warm invocations.
// connection_limit=1 prevents connection pool exhaustion on cold starts.
// connect_timeout=10 ensures we fail fast rather than hanging for 30 s (504).
function buildPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to your Vercel environment variables.'
    );
  }

  // Append serverless-safe parameters if not already present
  const dbUrl = url.includes('connection_limit')
    ? url
    : url + (url.includes('?') ? '&' : '?') + 'connection_limit=1&connect_timeout=10';

  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

// Only cache on globalThis in development to allow hot-reload without leaking connections.
// In production serverless, each container reuse reuses the module-level singleton.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
