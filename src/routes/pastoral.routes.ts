import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { pastoralController } from '../controllers/pastoral.controller';

const router = Router();

// All pastoral routes require authentication
router.use(authenticateJwt);

// ─── Spiritual Roster ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/pastoral/roster
 *
 * Establishes a spiritual-father/child relationship within the caller's
 * institution. Requires a clergy-level ecclesiastical role (enforced in the
 * controller). The service layer asserts the priest role and prevents duplicate
 * mappings with a ConflictError.
 */
router.post(
  '/roster',
  asyncHandler(async (req, res) => pastoralController.addSpiritualChild(req, res)),
);

/**
 * GET /api/v1/pastoral/roster
 *
 * Returns all SpiritualRoster entries for the authenticated priest within
 * their institution, including recent counseling log summaries.
 */
router.get(
  '/roster',
  asyncHandler(async (req, res) => pastoralController.listRoster(req, res)),
);

// ─── Counseling Logs ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/pastoral/counseling-logs
 *
 * Appends a pastoral counseling session log.
 * The service strictly validates that the authenticated caller is the assigned
 * spiritual father for the referenced roster — cross-priest writes throw
 * ForbiddenError.
 */
router.post(
  '/counseling-logs',
  asyncHandler(async (req, res) => pastoralController.logCounselingSession(req, res)),
);

// ─── Catechumen Discipleship Tracks ──────────────────────────────────────────

/**
 * GET /api/v1/pastoral/catechumens
 *
 * Lists all CatechumenRecord entries scoped to the caller's institution.
 * Supports optional `?status=` query parameter to filter by catechism stage.
 */
router.get(
  '/catechumens',
  asyncHandler(async (req, res) => pastoralController.listCatechumens(req, res)),
);

/**
 * PATCH /api/v1/pastoral/catechumens/:recordId/status
 *
 * Advances a catechumen through the linear discipleship state machine.
 * Valid progression: ENROLLED → INSTRUCTION → EXAMINATION → READY_FOR_BAPTISM → BAPTIZED.
 * The BAPTIZED transition executes inside a serializable transaction.
 */
router.patch(
  '/catechumens/:recordId/status',
  asyncHandler(async (req, res) => pastoralController.advanceCatechumen(req, res)),
);

export default router;
