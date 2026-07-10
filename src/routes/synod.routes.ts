import { Router } from 'express';
import { authenticateJwt, requireEpiscopalRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { synodController } from '../controllers/synod.controller';

const router = Router();

router.post(
  '/decrees/:id/vote',
  authenticateJwt,
  requireEpiscopalRole,
  asyncHandler(async (req, res) => synodController.vote(req, res)),
);

export default router;
