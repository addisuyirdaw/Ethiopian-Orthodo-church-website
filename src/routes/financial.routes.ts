import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { financialController } from '../controllers/financial.controller';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/contribute',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => financialController.contribute(req, res)),
);

router.get(
  '/ledger',
  tenantRbac(),
  asyncHandler(async (req, res) => financialController.listLedger(req, res)),
);

export default router;
