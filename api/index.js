// Serverless entrypoint for Vercel.
// This is plain JavaScript — intentionally NOT TypeScript.
// Vercel runs `npm run build` first (prisma generate + tsc → dist/),
// then @vercel/node bundles this JS file which requires the compiled output.
'use strict';

const { createApp } = require('../dist/app');

const app = createApp();

module.exports = app;
