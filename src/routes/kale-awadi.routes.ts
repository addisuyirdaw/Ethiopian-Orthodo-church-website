import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { Role } from '../constants/roles.enum';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { kaleAwadiController } from '../controllers/kale-awadi.controller';

const router = Router();

// All routes require authentication
router.use(authenticateJwt);

/**
 * POST /api/v1/governance/sebeka-gubae/seats
 * Assign a member to a Sebeka Gubae seat (parish council role).
 * Requires write permission in the same institution.
 */
router.post(
  '/sebeka-gubae/seats',
  roleGuard([Role.ADMIN, Role.PRIEST]),
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(kaleAwadiController.assignSeat),
);

/**
 * GET /api/v1/governance/sebeka-gubae/seats/:institutionId
 * Retrieve all active Sebeka Gubae seats for a parish.
 * Requires read permission (same or upstream).
 */
router.get(
  '/sebeka-gubae/seats/:institutionId',
  tenantRbac(),
  asyncHandler(kaleAwadiController.getActiveSeats),
);

/**
 * DELETE /api/v1/governance/sebeka-gubae/seats/:seatId
 * Deactivate a Sebeka Gubae seat assignment.
 * Target verification is performed in the service layer using the seat's institution.
 */
router.delete(
  '/sebeka-gubae/seats/:seatId',
  roleGuard([Role.ADMIN, Role.PRIEST]),
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(kaleAwadiController.deactivateSeat),
);

/**
 * POST /api/v1/governance/qale-gubae/minutes
 * Record a Qale Gubae council meeting minutes entry.
 * Requires write permission in the same institution.
 */
router.post(
  '/qale-gubae/minutes',
  roleGuard([Role.ADMIN, Role.SECRETARY, Role.PRIEST]),
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(kaleAwadiController.recordMinutes),
);

/**
 * GET /api/v1/governance/qale-gubae/minutes/:institutionId
 * Retrieve the historical council meeting minutes ledger for a parish.
 * Requires read permission (same or upstream).
 */
router.get(
  '/qale-gubae/minutes/:institutionId',
  tenantRbac(),
  asyncHandler(kaleAwadiController.getMinutes),
);

// ─── Dual Authorization Workflows ───────────────────────────────────────────────

/**
 * POST /api/v1/governance/request-action
 * 
 * Create a dual-authorization request for a sensitive governance action.
 * Per Ethiopian Orthodox Tewahedo Church Administrative Constitution (2009 E.C. 4th Edition),
 * actions like bank withdrawals, asset disposals, and budget modifications require approval from:
 *   - CHAIRPERSON (Liqe Menber)
 *   - DEPUTY_CHAIRPERSON (Mek Liqe Menber)
 * 
 * Requesting user must have CHAIRPERSON, DEPUTY_CHAIRPERSON, or ACCOUNTANT role.
 * 
 * Request body:
 * {
 *   "institutionId": "uuid",
 *   "payloadType": "BANK_WITHDRAWAL|ASSET_DISPOSAL|BUDGET_MODIFICATION|...",
 *   "payloadJson": { ...action details... }  or stringified JSON
 * }
 * 
 * Response includes requestId and status PENDING.
 */
router.post(
  '/request-action',
  roleGuard([Role.ADMIN, Role.SECRETARY, Role.PRIEST]),
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(kaleAwadiController.requestAction),
);

/**
 * POST /api/v1/governance/approve-action
 * 
 * Approve or reject a pending dual-authorization request.
 * Only CHAIRPERSON or DEPUTY_CHAIRPERSON can approve.
 * 
 * Request body:
 * {
 *   "requestId": "uuid",
 *   "approve": true|false,
 *   "rejectionReason": "optional reason if rejecting"
 * }
 * 
 * When BOTH CHAIRPERSON and DEPUTY_CHAIRPERSON approve:
 *   → status changes to APPROVED (ready for execution)
 * 
 * When either rejects (approve=false):
 *   → status changes to REJECTED immediately
 */
router.post(
  '/approve-action',
  roleGuard([Role.ADMIN, Role.SECRETARY, Role.PRIEST]),
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(kaleAwadiController.approveAction),
);

export default router;
