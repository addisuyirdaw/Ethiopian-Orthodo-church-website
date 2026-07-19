// src/routes/notification.routes.ts
import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { notificationController } from '../controllers/notification.controller';

const router = Router();
router.use(authenticateJwt);

router.get('/', asyncHandler((req, res) => notificationController.list(req, res)));
router.post('/:id/read', asyncHandler((req, res) => notificationController.markAsRead(req, res)));

export default router;
