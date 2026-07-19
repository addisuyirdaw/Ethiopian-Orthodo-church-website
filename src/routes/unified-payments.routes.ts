import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { unifiedPaymentsController } from '../controllers/unified-payments.controller';

const router = Router();

/**
 * POST /api/v1/fintech/unified/merchant-config
 * Upsert merchant config for an institution. Required same-institution (parish admin / treasurer write).
 */
router.post(
  '/merchant-config',
  authenticateJwt,
  tenantRbac({ requireSameInstitution: true }),
  asyncHandler(unifiedPaymentsController.configureMerchant),
);

/**
 * GET /api/v1/fintech/unified/merchant-config/:institutionId
 * Retrieve merchant configuration.
 */
router.get(
  '/merchant-config/:institutionId',
  authenticateJwt,
  tenantRbac(),
  asyncHandler(unifiedPaymentsController.getMerchantConfig),
);

/**
 * POST /api/v1/fintech/unified/transactions/initiate
 * Initiate a unified transaction.
 */
router.post(
  '/transactions/initiate',
  authenticateJwt,
  tenantRbac(),
  asyncHandler(unifiedPaymentsController.initiatePayment),
);

/**
 * GET /api/v1/fintech/unified/transactions/history/:institutionId
 * Get history of payments for a parish.
 */
router.get(
  '/transactions/history/:institutionId',
  authenticateJwt,
  tenantRbac(),
  asyncHandler(unifiedPaymentsController.getTransactionHistory),
);

/**
 * POST /api/v1/fintech/unified/webhook/:provider
 * Receive payment success or failure callback from the payment gateway.
 * Security is handled via HMAC-SHA256 signature verification in the controller.
 */
router.post(
  '/webhook/:provider',
  asyncHandler(unifiedPaymentsController.handleWebhook),
);

export default router;
