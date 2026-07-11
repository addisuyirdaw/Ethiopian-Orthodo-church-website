import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import {
  initiateDonation,
  handlePublicPaymentWebhook,
  listPublicTenants,
} from '../controllers/public-payment.controller';

const router = Router();

/**
 * POST /api/v1/public/donate
 * Public lay donation initiation.
 */
router.post('/donate', asyncHandler(initiateDonation));

/**
 * POST /api/v1/public/payment-webhook
 * Public webhook handler (verified via HMAC-SHA256 signature).
 */
router.post('/payment-webhook', asyncHandler(handlePublicPaymentWebhook));

/**
 * GET /api/v1/public/tenants
 * Fetch the list of active parishes and monasteries.
 */
router.get('/tenants', asyncHandler(listPublicTenants));

export default router;
