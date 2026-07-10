import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { hymnologyController } from '../controllers/hymnology.controller';

const router = Router();

// ─── Public routes ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/hymnology/compositions/suggested
 * Public endpoint to fetch suggested compositions for a date.
 */
router.get(
  '/compositions/suggested',
  asyncHandler(async (req, res) => hymnologyController.getSuggestedHymns(req, res))
);

// ─── Authenticated routes ─────────────────────────────────────────────────────

router.use(authenticateJwt);

/**
 * POST /api/v1/hymnology/compositions
 * Authenticated endpoint to register new sacred compositions.
 * Clerical or director roles verified at the controller level.
 */
router.post(
  '/compositions',
  asyncHandler(async (req, res) => hymnologyController.createComposition(req, res))
);

/**
 * POST /api/v1/hymnology/choir/register
 * Authenticated endpoint to register a choir member under the caller's institution.
 */
router.post(
  '/choir/register',
  asyncHandler(async (req, res) => hymnologyController.registerChoirMember(req, res))
);

export default router;
