import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { vaultController } from '../controllers/vault.controller';

const router = Router();

/**
 * POST /api/v1/vault/seal/:recordId
 *
 * Generates an RSA-PSS-SHA256 cryptographic proof seal for the given
 * sacramental record. Requires authentication and priest-level RBAC.
 * The record is permanently locked after this call.
 */
router.post(
  '/seal/:recordId',
  authenticateJwt,
  tenantRbac({ requireSameInstitution: false }),
  asyncHandler(async (req, res) => vaultController.sealRecord(req, res)),
);

/**
 * POST /api/v1/vault/verify-seal
 *
 * Public verification gateway — no authentication token required.
 * Accepts { recordId, signature } and returns verification status plus
 * canonical record data if the signature is valid.
 */
router.post(
  '/verify-seal',
  asyncHandler(async (req, res) => vaultController.verifyPublic(req, res)),
);

export default router;
