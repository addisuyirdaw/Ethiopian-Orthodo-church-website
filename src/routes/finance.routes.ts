import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { financeController } from '../controllers/finance.controller';

const router = Router();

// Authenticated route for contribution initialization
router.post(
  '/contributions/initialize',
  authenticateJwt,
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => financeController.initialize(req, res)),
);

// Public route for payment gateway webhooks (secured via signature check inside controller)
router.post(
  '/webhooks/:gateway',
  asyncHandler(async (req, res) => financeController.webhook(req, res)),
);

export default router;
