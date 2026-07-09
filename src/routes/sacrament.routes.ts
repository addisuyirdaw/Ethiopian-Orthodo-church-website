import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { sacramentController } from '../controllers/sacrament.controller';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/',
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(async (req, res) => sacramentController.create(req, res)),
);

router.get(
  '/',
  tenantRbac(),
  asyncHandler(async (req, res) => sacramentController.list(req, res)),
);

/**
 * GET /api/v1/sacraments/:id/verify
 *
 * Returns a cryptographic verification seal and canonical metadata for a
 * specific sacramental record. Protected by tenant RBAC.
 */
router.get(
  '/:id/verify',
  tenantRbac(),
  asyncHandler(async (req, res) => sacramentController.verify(req, res)),
);

export default router;

