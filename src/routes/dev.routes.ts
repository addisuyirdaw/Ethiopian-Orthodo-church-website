import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

router.get('/init-db', async (req, res, next) => {
  try {
    console.log('🔄 Dev database initialization triggered...');

    // 1. Run prisma db push to ensure schema is applied to database
    console.log('Running: npx prisma db push --accept-data-loss');
    const { stdout: pushStdout, stderr: pushStderr } = await execAsync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
    });
    console.log(pushStdout);
    if (pushStderr) console.warn(pushStderr);

    // 2. Run seed script using tsx
    console.log('Running: npx tsx prisma/seed.ts');
    const { stdout: seedStdout, stderr: seedStderr } = await execAsync('npx tsx prisma/seed.ts', {
      cwd: process.cwd(),
    });
    console.log(seedStdout);
    if (seedStderr) console.warn(seedStderr);

    res.status(200).json({
      status: 'success',
      message: 'Database initialized and seeded successfully.',
      details: {
        push: pushStdout,
        seed: seedStdout,
      },
    });
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database initialization failed. Ensure PostgreSQL is running and DATABASE_URL is configured.',
      error: error.message || String(error),
      stdout: error.stdout,
      stderr: error.stderr,
    });
  }
});

export default router;
