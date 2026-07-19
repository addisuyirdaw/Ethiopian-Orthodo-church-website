import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { parishionersController } from '../controllers/parishioners.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/parishioners
 * Public listing of all parishioners (for Directory Dashboard).
 * In production this would be behind authenticateJwt + role guard.
 * Returns objects matching the frontend Parishioner interface.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => parishionersController.list(req, res)),
);

/**
 * GET /api/v1/parishioners/:id
 * Single parishioner by UUID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => parishionersController.getOne(req, res)),
);

/**
 * POST /api/v1/parishioners
 * Register a new parishioner.
 * Protected by JWT authentication.
 */
router.post(
  '/',
  authenticateJwt,
  asyncHandler(async (req, res) => parishionersController.create(req, res)),
);

export default router;

