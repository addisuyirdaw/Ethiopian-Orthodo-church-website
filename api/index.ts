// Serverless entrypoint for Vercel.
// @vercel/node compiles this TypeScript file directly.
// prisma generate runs first via the vercel-build npm script,
// so all generated Prisma types are available at compile time.

import { createApp } from '../src/app';

const app = createApp();

export default app;
