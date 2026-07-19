// src/routes/admin.routes.ts
import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();
router.use(authenticateJwt);

// Managing dioceses
router.post('/dioceses', asyncHandler((req, res) => adminController.addDiocese(req, res)));
router.put('/dioceses/:id', asyncHandler((req, res) => adminController.editDiocese(req, res)));

// Managing parishes (churches)
router.post('/institutions', asyncHandler((req, res) => adminController.addChurch(req, res)));
router.put('/institutions/:id', asyncHandler((req, res) => adminController.editChurch(req, res)));

// Toggle status
router.post('/institutions/:id/activate', asyncHandler((req, res) => adminController.activateChurch(req, res)));
router.post('/institutions/:id/deactivate', asyncHandler((req, res) => adminController.deactivateChurch(req, res)));

export default router;
