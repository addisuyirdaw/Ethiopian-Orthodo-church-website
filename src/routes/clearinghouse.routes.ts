import { Router } from 'express';
import { handleSettlementWebhook } from '../controllers/clearinghouse.controller';

const router = Router();

/**
 * POST /api/v1/fintech/clearing/webhook
 *
 * No JWT authentication — this route is secured exclusively by the HMAC
 * signature supplied in the `x-signature` header by the payment gateway.
 *
 * The raw request body is captured globally by the `verify` callback on
 * `express.json()` in app.ts and stored at `req.rawBody`, so no additional
 * body-reading middleware is needed here.
 */
router.post('/webhook', handleSettlementWebhook);

export default router;
