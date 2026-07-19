import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { clergyController } from '../controllers/clergy.controller';

const router = Router();

router.use(authenticateJwt);

/**
 * GET /api/v1/clergy
 *
 * Returns a list of all active clergy members.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => clergyController.list(req, res)),
);

/**
 * GET /api/v1/clergy/verify/:clergyId
 *
 * Returns the canonical authority status of the given clergy member.
 * Throws a localized Amharic-first CanonicalStatusException if the clergy
 * is not in active good standing.
 */
router.get(
  '/verify/:clergyId',
  tenantRbac(),
  asyncHandler(async (req, res) => clergyController.verify(req, res)),
);

export default router;

