import { Router } from 'express';
import { authenticateJwt, requireEpiscopalRole } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import {
  getSubscription,
  patchSubscription,
  getUpcoming,
  triggerAlertDigest,
} from '../controllers/liturgical-alert.controller';

const router = Router();

// All routes require a valid JWT and tenant RBAC check.
router.use(authenticateJwt, tenantRbac());

/**
 * GET /liturgical/alerts/subscription
 * Returns the tenant's current alert subscription settings.
 */
router.get('/alerts/subscription', getSubscription);

/**
 * PATCH /liturgical/alerts/subscription
 * Partially updates the tenant's alert subscription settings.
 */
router.patch('/alerts/subscription', patchSubscription);

/**
 * GET /liturgical/alerts/upcoming
 * Returns the upcoming feast / fasting day feed within the look-ahead window.
 */
router.get('/alerts/upcoming', getUpcoming);

/**
 * POST /liturgical/alerts/trigger
 * Builds and returns the full alert digest payload.
 * Episcopal role (Bishop, Metropolitan, Archbishop, Patriarch) required.
 */
router.post('/alerts/trigger', requireEpiscopalRole, triggerAlertDigest);

export default router;
