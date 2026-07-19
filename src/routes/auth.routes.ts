import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { authController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/signup',
  asyncHandler(async (req, res) => authController.signup(req, res)),
);

router.post(
  '/register',
  asyncHandler(async (req, res) => authController.signup(req, res)),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => authController.login(req, res)),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => authController.logout(req, res)),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => authController.refresh(req, res)),
);

router.get(
  '/me',
  authenticateJwt,
  asyncHandler(async (req, res) => authController.me(req, res)),
);

export default router;

