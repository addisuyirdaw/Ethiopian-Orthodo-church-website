import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { synodalController } from '../controllers/synodal.controller';

const router = Router();

// All synodal routes are authenticated
router.use(authenticateJwt);

/**
 * GET /api/v1/synodal/analytics/:dioceseId
 * Fetch diocesan metrics aggregates.
 */
router.get(
  '/analytics/:dioceseId',
  asyncHandler(async (req, res) => synodalController.getDiocesanMetrics(req, res))
);

/**
 * POST /api/v1/synodal/clergy/transfer
 * Execute a clerical transfer.
 */
router.post(
  '/clergy/transfer',
  asyncHandler(async (req, res) => synodalController.executeClergyTransfer(req, res))
);

export default router;
