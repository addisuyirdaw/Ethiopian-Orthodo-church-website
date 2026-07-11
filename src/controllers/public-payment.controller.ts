import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  publicDonateSchema,
  publicPaymentWebhookSchema,
} from '../validators/public-payment.validator';
import {
  initiatePublicDonation,
  settlePublicDonationWebhook,
} from '../services/public-donation.service';
import { institutionRepository } from '../repositories/institution.repository';

// ── Webhook secret (sourced from environment at runtime) ─────────────────────
const DONATION_WEBHOOK_SECRET =
  process.env.DONATION_WEBHOOK_SECRET ??
  process.env.CLEARING_WEBHOOK_SECRET ??
  'development-donation-webhook-secret';

/**
 * Verifies the HMAC-SHA256 signature from the payment gateway webhook.
 *
 * The gateway must compute:
 *   signature = HMAC-SHA256(rawBody, DONATION_WEBHOOK_SECRET)
 * and send the hex-encoded result in the `x-signature` header.
 *
 * Uses `crypto.timingSafeEqual` to resist timing-oracle attacks.
 */
function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', DONATION_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return false;
  }
}

// ── POST /api/v1/public/donate ────────────────────────────────────────────────

/**
 * Unauthenticated lay donation initiation.
 *
 * Validates the request body, generates an OC-TXN-<UUID> reference,
 * persists a PENDING transaction, contacts the selected payment gateway,
 * and returns the checkout redirect URL.
 *
 * No JWT authentication is required — this endpoint is intentionally public.
 */
export async function initiateDonation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Strict Zod schema validation
    const parseResult = publicDonateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        issues: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const result = await initiatePublicDonation(parseResult.data);

    // Return only the minimum information needed by the client.
    // No internal DB IDs, no raw JSON responses, no engineering artifacts.
    res.status(201).json({
      success: true,
      data: {
        txnReference: result.txnReference,
        gatewayUrl: result.gatewayUrl,
        institutionName: result.institution.name,
        message: 'ክፍያ ለመጀመር ወደ ጌትዌይ ይዘዋወሩ።',
      },
    });
  } catch (error: unknown) {
    next(error);
  }
}

// ── POST /api/v1/public/payment-webhook ──────────────────────────────────────

/**
 * Payment-gateway webhook handler.
 *
 * Security: secured exclusively by HMAC-SHA256 signature verification.
 * No JWT is required or accepted on this route.
 *
 * Upon receiving a SUCCESS event:
 * 1. Verifies the gateway signature.
 * 2. Locates the matching OC-TXN-* record.
 * 3. Updates status to COMPLETED.
 * 4. Executes the canonical 90 % (parish) / 10 % (Holy Synod) split audit.
 */
export async function handlePublicPaymentWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Signature verification — mandatory
    const signature = req.headers['x-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing x-signature header. Webhook calls must be signed.',
      });
      return;
    }

    const rawBody: Buffer = req.rawBody ?? Buffer.alloc(0);
    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Webhook signature verification failed.',
      });
      return;
    }

    // 2. Parse and validate the webhook payload
    const parseResult = publicPaymentWebhookSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        issues: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const { txnReference, status } = parseResult.data;

    // 3. Settle the transaction and compute split summary
    const settlementResult = await settlePublicDonationWebhook(
      txnReference,
      status,
    );

    res.status(200).json({
      success: true,
      data: {
        txnReference: settlementResult.txnReference,
        finalStatus: settlementResult.status,
        canonicalSplit: {
          parishAllocation: {
            percentage: '90.00',
            amount: settlementResult.parishShare,
          },
          holySynodAllocation: {
            percentage: '10.00',
            amount: settlementResult.patriarchateShare,
          },
        },
        settledAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    // Prisma unique constraint violation — already settled
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      res.status(409).json({
        error: 'Conflict',
        message: 'This transaction reference has already been settled.',
      });
      return;
    }
    next(error);
  }
}

// ── GET /api/v1/public/tenants ────────────────────────────────────────────────

/**
 * Returns the list of active parishes and monasteries for the frontend dropdown.
 * Completely public — no authentication required.
 * Returns only the institution name and ID (no sensitive metadata).
 */
export async function listPublicTenants(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const allInstitutions = await institutionRepository.findAll();

    // Filter to only leaf-level institutions (PARISH and MONASTERY)
    // and expose only the minimal display fields.
    const tenants = allInstitutions
      .filter(
        (inst) =>
          inst.type === 'PARISH' || inst.type === 'MONASTERY',
      )
      .map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: inst.type,
      }));

    res.status(200).json({ success: true, data: tenants });
  } catch (error: unknown) {
    next(error);
  }
}
