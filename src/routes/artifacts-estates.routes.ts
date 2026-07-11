import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { artifactsEstatesController } from '../controllers/artifacts-estates.controller';

const router = Router();

// All routes require authentication and tenant-level access checks
router.use(authenticateJwt);

/**
 * POST /api/v1/logistics/artifacts
 * Register a new historical artifact profile (Clergy role required).
 */
router.post(
  '/artifacts',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => artifactsEstatesController.registerArtifact(req, res))
);

/**
 * GET /api/v1/logistics/artifacts
 * Fetch all authorized historical artifact profiles.
 */
router.get(
  '/artifacts',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => artifactsEstatesController.listArtifacts(req, res))
);

/**
 * POST /api/v1/logistics/artifacts/:id/inspect
 * Log a physical condition inspection snapshot for an artifact (Clergy role required).
 */
router.post(
  '/artifacts/:id/inspect',
  asyncHandler(async (req, res) => artifactsEstatesController.logArtifactInspection(req, res))
);

/**
 * POST /api/v1/logistics/estates
 * Register GPS-bounded monastic land charts (Episcopal role required).
 */
router.post(
  '/estates',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => artifactsEstatesController.registerEstate(req, res))
);

/**
 * GET /api/v1/logistics/estates
 * Fetch all authorized monastic estate profiles.
 */
router.get(
  '/estates',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => artifactsEstatesController.listEstates(req, res))
);

export default router;
