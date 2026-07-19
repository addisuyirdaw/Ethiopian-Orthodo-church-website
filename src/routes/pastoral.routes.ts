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

// ─── Priest-Follower Spiritual Assignment (የነፍስ አባት ምረጫ) ──────────────────────

/**
 * POST /api/v1/pastoral/assign-priest
 * 
 * A parishioner (MIMEN/LAITY) selects or changes their spiritual father (የነፍስ አባት).
 * Creates/updates a SpiritualChildRelation record.
 * 
 * Per Ethiopian Orthodox Tewahedo Church teachings:
 * - Each parishioner has ONE active spiritual father
 * - Priest and parishioner must belong to same institution
 * 
 * Request body:
 * {
 *   "priestUserId": "uuid"  // The priest (clergy member) to assign
 * }
 * 
 * Requires: Authenticated user (typically MIMEN/LAITY requesting assignment)
 */
router.post(
  '/assign-priest',
  asyncHandler(async (req, res) => pastoralController.assignPriest(req, res)),
);

/**
 * GET /api/v1/pastoral/my-spiritual-children
 * 
 * Retrieves all followers (parishioners) assigned to the authenticated priest.
 * Includes latest confession date and penance status for each follower.
 * 
 * Per Ethiopian Orthodox Tewahedo Church teachings:
 * - Only PRIEST ecclesiastical role can retrieve this data
 * - Returns sanitized data (no passwords, no raw confession notes)
 * 
 * Query parameters:
 *   ?limit=50   (default 50, max 100)
 *   ?offset=0   (default 0 for pagination)
 * 
 * Response includes:
 * {
 *   "data": [
 *     {
 *       "parishionerId": "uuid",
 *       "parishionerName": "...",
 *       "lastConfessionDate": "ISO 8601 datetime or null",
 *       "lastPenanceText": "e.g., 40-day fast",
 *       "assignedAt": "ISO 8601 datetime"
 *     }
 *   ]
 * }
 * 
 * Requires: Authenticated priest user
 */
router.get(
  '/my-spiritual-children',
  asyncHandler(async (req, res) => pastoralController.getMySpirtualChildren(req, res)),
);

/**
 * POST /api/v1/pastoral/log-confession
 * 
 * Records a confession (ቦታ/ፍርድ) session between authenticated priest and parishioner.
 * Creates immutable ConfessionRecord with:
 *   - Encrypted notes (stored confidentially, never exposed)
 *   - Prescribed penance (ቀኖና)
 *   - Next scheduled confession date
 *   - Timestamp and priest ID for audit trail
 * 
 * Per Ethiopian Orthodox Tewahedo Church teachings:
 * - Only the assigned priest can record confession for their parishioner
 * - Confession content is confidential and protected
 * - Section: ቦታ/ፍርድ-ሪደምታ-ቀኖና (Confession & Penance Recording)
 * 
 * Request body:
 * {
 *   "parishionerId": "uuid",
 *   "notes": "optional encrypted confession summary",
 *   "penanceText": "e.g., 40-day fast, 5 Kyrie Eleison",
 *   "nextScheduledDate": "ISO 8601 datetime (optional)"
 * }
 * 
 * Response (sanitized - no confession details):
 * {
 *   "id": "uuid",
 *   "parishionerName": "...",
 *   "priestName": "...",
 *   "recordedAt": "ISO 8601 datetime",
 *   "nextScheduledDate": "ISO 8601 datetime or null",
 *   "penanceText": "...",
 *   "message": "Confession recorded successfully."
 * }
 * 
 * Requires: Authenticated priest user with PRIEST ecclesiastical role
 */
router.post(
  '/log-confession',
  asyncHandler(async (req, res) => pastoralController.logConfession(req, res)),
);

export default router;
