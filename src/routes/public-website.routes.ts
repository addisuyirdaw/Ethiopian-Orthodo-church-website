// src/routes/public-website.routes.ts
// Phase 1 public website routes — no authentication required

import { Router } from 'express';
import {
  submitPrayerRequest,
  getPrayerRequestStatus,
  publicHealth,
} from '../controllers/public.controller';

const router = Router();

// Health
router.get('/health', publicHealth);

// Prayer Requests — open to all (no auth middleware)
router.post('/prayer-request', submitPrayerRequest);
router.get('/prayer-request/:id', getPrayerRequestStatus);

export default router;
