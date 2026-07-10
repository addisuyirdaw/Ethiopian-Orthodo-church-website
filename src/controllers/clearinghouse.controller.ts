import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { processIncomingSettlement } from '../services/fintech/clearinghouse.service';

const WEBHOOK_SECRET = process.env.CLEARING_WEBHOOK_SECRET ?? 'development-clearing-secret';

/**
 * Verifies the HMAC-SHA256 signature supplied by the payment gateway.
 *
 * The gateway is expected to compute:
 *   signature = HMAC-SHA256( rawBody, CLEARING_WEBHOOK_SECRET )
 * and send it as a hex string in the `x-signature` request header.
 *
 * Uses `crypto.timingSafeEqual` to prevent timing-oracle attacks.
 */
function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    // Buffer lengths differ → invalid hex or truncated signature
    return false;
  }
}

/**
 * POST /api/v1/fintech/clearing/webhook
 *
 * Inbound payment-gateway webhook endpoint.  No JWT auth is applied because
 * the route is secured exclusively through HMAC signature verification.
 *
 * Expected JSON body:
 * {
 *   "reference": "TXN-ABC123",
 *   "amount":    1000.00,
 *   "currency":  "ETB",
 *   "tenantId":  "<institution-uuid>",
 *   "gateway":   "CHAPA" | "TELEBIRR" | "CBE_BIRR" | "STRIPE"
 * }
 */
export async function handleSettlementWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const signature = req.headers['x-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing x-signature header.',
      });
      return;
    }

    // `req.rawBody` is populated by the `verify` callback on express.json() in app.ts
    const rawBody: Buffer = req.rawBody ?? Buffer.alloc(0);

    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Webhook signature verification failed.',
      });
      return;
    }

    const { reference, amount, currency, tenantId, gateway } = req.body as {
      reference?: unknown;
      amount?: unknown;
      currency?: unknown;
      tenantId?: unknown;
      gateway?: unknown;
    };

    if (
      typeof reference !== 'string' || !reference ||
      typeof amount !== 'number' || amount <= 0 ||
      typeof currency !== 'string' || !currency ||
      typeof tenantId !== 'string' || !tenantId ||
      typeof gateway !== 'string' || !gateway
    ) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or missing required fields: reference, amount, currency, tenantId, gateway.',
      });
      return;
    }

    const result = await processIncomingSettlement({
      reference,
      amount,
      currency,
      tenantId,
      gateway,
    });

    res.status(200).json({
      success: true,
      data: {
        id: result.id,
        referenceNumber: result.referenceNumber,
        totalAmount: result.totalAmount.toFixed(4),
        splits: {
          parish: result.parishShare.toFixed(4),
          diocese: result.dioceseShare.toFixed(4),
          patriarchate: result.patriarchateShare.toFixed(4),
          platform: result.platformFee.toFixed(4),
        },
        status: result.status,
        createdAt: result.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    // Prisma unique constraint violation — duplicate reference
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A settlement with this reference number already exists.',
      });
      return;
    }

    next(error);
  }
}
