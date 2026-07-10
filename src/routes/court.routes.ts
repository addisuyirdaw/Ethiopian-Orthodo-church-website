import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { courtController } from '../controllers/court.controller';

const router = Router();

// All canonical court routes require a valid JWT.
router.use(authenticateJwt);

/**
 * GET /api/v1/canonical-court/cases
 * Returns the list of canonical cases for the authenticated user's tenant.
 * Service-layer enforces judicial clearance check (403 for non-judicial roles).
 */
router.get(
  '/cases',
  asyncHandler(async (req, res) => courtController.listCases(req, res)),
);

/**
 * POST /api/v1/canonical-court/cases
 * Files a new canonical case. Restricted to PRIEST, DIOCESAN_ADMIN and above.
 */
router.post(
  '/cases',
  asyncHandler(async (req, res) => courtController.createCase(req, res)),
);

/**
 * POST /api/v1/canonical-court/standing
 * Mutates a clergy member's canonical standing.
 * Restricted to BISHOP and above — enforced inside the service layer.
 */
router.post(
  '/standing',
  asyncHandler(async (req, res) => courtController.mutateStanding(req, res)),
);

export default router;
