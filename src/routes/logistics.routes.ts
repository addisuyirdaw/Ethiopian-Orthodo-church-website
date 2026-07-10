import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { logisticsController } from '../controllers/logistics.controller';

const router = Router();

// ─── All logistics routes require authentication ───────────────────────────────

router.use(authenticateJwt);

// ─── Supply Batch Routes ───────────────────────────────────────────────────────

/**
 * POST /api/v1/logistics/batches
 * Create a new sacramental supply batch.
 * Same-institution write by default; admin may specify institutionId override.
 */
router.post(
  '/batches',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => logisticsController.createBatch(req, res)),
);

/**
 * GET /api/v1/logistics/batches
 * List all supply batches for the resolved institution.
 */
router.get(
  '/batches',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => logisticsController.listBatches(req, res)),
);

/**
 * GET /api/v1/logistics/batches/:batchId
 * Retrieve a single supply batch by ID.
 */
router.get(
  '/batches/:batchId',
  asyncHandler(async (req, res) => logisticsController.getBatch(req, res)),
);

// ─── Supply Transfer Routes ────────────────────────────────────────────────────

/**
 * POST /api/v1/logistics/transfers
 * Initiate a supply transfer from caller's institution to another.
 * Atomically reserves stock using a serializable transaction.
 */
router.post(
  '/transfers',
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(async (req, res) => logisticsController.initiateTransfer(req, res)),
);

/**
 * GET /api/v1/logistics/transfers
 * List all supply transfers originating from the resolved institution.
 */
router.get(
  '/transfers',
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => logisticsController.listTransfers(req, res)),
);

/**
 * PATCH /api/v1/logistics/transfers/:transferId/status
 * Advance a supply transfer through its lifecycle state machine.
 * (REQUESTED → IN_TRANSIT → DELIVERED | CANCELLED)
 */
router.patch(
  '/transfers/:transferId/status',
  asyncHandler(async (req, res) => logisticsController.updateTransferStatus(req, res)),
);

export default router;
