import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post(
  '/signup',
  asyncHandler(async (req, res) => authController.signup(req, res)),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => authController.login(req, res)),
);

export default router;
