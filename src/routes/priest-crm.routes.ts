import { Router } from 'express';
import { authenticateJwt, requirePriestRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { priestCrmController } from '../controllers/priest-crm.controller';

const router = Router();

router.get(
  '/my-followers',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => priestCrmController.getMyFollowers(req, res, next)),
);

router.post(
  '/followers',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => priestCrmController.createFollower(req, res, next)),
);

router.put(
  '/followers/:id',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => priestCrmController.updateFollower(req, res, next)),
);

router.delete(
  '/followers/:id',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => priestCrmController.deleteFollower(req, res, next)),
);

export default router;
