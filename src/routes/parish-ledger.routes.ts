import { Router } from 'express';
import { authenticateJwt, requireTreasurerRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { parishLedgerController } from '../controllers/parish-ledger.controller';

const router = Router();

/**
 * POST /api/v1/parish/webhook
 *
 * Public (unauthenticated) endpoint — security is enforced via HMAC-SHA256
 * signature verification inside the controller. The userId is embedded in
 * the signed payload by the payment initiation flow.
 *
 * Called by: Telebirr, CBE Birr, and Bank Transfer gateway callbacks.
 */
router.post(
  '/webhook',
  asyncHandler((req, res, next) => parishLedgerController.ingestWebhook(req, res, next)),
);

/**
 * GET /api/v1/transactions/history
 *
 * Authenticated. Returns the calling user's full parish contribution history.
 * Role: Any authenticated user (LAITY, DEACON, PRIEST, etc.).
 */
router.get(
  '/history',
  authenticateJwt,
  asyncHandler((req, res, next) => parishLedgerController.getMyHistory(req, res, next)),
);

/**
 * GET /api/v1/treasury/ledger
 *
 * Authenticated. Restricted to TREASURER role (Gimja Bet).
 * Returns all ParishLedger rows for the Treasurer's institution,
 * showing: donor name, amount, category, method, and target priest.
 */
router.get(
  '/treasury-ledger',
  authenticateJwt,
  requireTreasurerRole,
  asyncHandler((req, res, next) => parishLedgerController.getTreasuryLedger(req, res, next)),
);

export default router;
