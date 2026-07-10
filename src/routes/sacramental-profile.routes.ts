import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { sacramentalProfileController } from '../controllers/sacramental-profile.controller';

const router = Router();

// Protect all routes under this namespace with JWT verification
router.use(authenticateJwt);

/**
 * POST /api/v1/sacramental/baptism
 * Requires tenant-rbac to verify that the active user can write to the parish.
 */
router.post(
  '/baptism',
  tenantRbac({ requireSameInstitution: true }),
  (req, res, next) => sacramentalProfileController.registerBaptism(req, res, next)
);

/**
 * POST /api/v1/sacramental/marriage/verify-and-register
 * Enforces canonical cross-parish verification.
 */
router.post(
  '/marriage/verify-and-register',
  tenantRbac({ requireSameInstitution: true }),
  (req, res, next) => sacramentalProfileController.verifyAndRegisterMarriage(req, res, next)
);

export default router;
