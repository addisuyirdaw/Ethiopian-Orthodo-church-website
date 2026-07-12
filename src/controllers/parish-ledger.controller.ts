import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { parishLedgerService } from '../services/parish-ledger.service';

// ── Webhook signature secret ────────────────────────────────────────────────
const PARISH_WEBHOOK_SECRET =
  process.env.PARISH_WEBHOOK_SECRET ??
  process.env.DONATION_WEBHOOK_SECRET ??
  process.env.CLEARING_WEBHOOK_SECRET ??
  'development-parish-webhook-secret';

/**
 * Verifies the HMAC-SHA256 signature on inbound gateway webhooks.
 * The gateway must compute:
 *   signature = HMAC-SHA256(rawBody, PARISH_WEBHOOK_SECRET) hex-encoded
 * and send it in the `x-signature` header.
 */
function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', PARISH_WEBHOOK_SECRET)
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

// ── Zod validation schema ────────────────────────────────────────────────────

const parishWebhookSchema = z.object({
  /** Authenticated user ID — must be supplied by the payment session context */
  userId: z.string().uuid({ message: 'userId must be a valid UUID.' }),

  /** Ledger category: ASRAT | BEKURAT | PRIEST_GIFT | GENERAL_DONATION */
  category: z.enum(['ASRAT', 'BEKURAT', 'PRIEST_GIFT', 'GENERAL_DONATION'], {
    errorMap: () => ({
      message: 'category must be ASRAT, BEKURAT, PRIEST_GIFT, or GENERAL_DONATION.',
    }),
  }),

  /** Amount in decimal string or number */
  amount: z
    .union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)])
    .transform(String),

  /** ISO-4217 currency (default ETB) */
  currency: z.enum(['ETB', 'USD']).optional(),

  /** Payment gateway method */
  method: z.enum(['TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER'], {
    errorMap: () => ({ message: 'method must be TELEBIRR, CBE_BIRR, or BANK_TRANSFER.' }),
  }),

  /** Gateway-issued unique transaction reference */
  referenceNumber: z
    .string({ required_error: 'referenceNumber is required.' })
    .min(1, 'referenceNumber must not be empty.'),

  /** Optional — priest UUID for PRIEST_GIFT payments */
  targetPriestId: z.string().uuid().optional().nullable(),
});

// ── Controllers ──────────────────────────────────────────────────────────────

export class ParishLedgerController {
  /**
   * POST /api/v1/parish/webhook
   *
   * Receives a verified payment gateway callback and creates a ParishLedger
   * entry linked to the authenticated user. Secured via HMAC-SHA256 signature.
   *
   * The userId MUST be embedded in the webhook payload by the payment
   * initiation flow (stored as a metadata field on the gateway session).
   */
  async ingestWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Signature verification
      const signature = req.headers['x-signature'];
      if (!signature || typeof signature !== 'string') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing x-signature header. All webhook calls must be signed.',
        });
        return;
      }

      const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
      if (!verifyWebhookSignature(rawBody, signature)) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Webhook signature verification failed.',
        });
        return;
      }

      // 2. Validate body
      const parseResult = parishWebhookSchema.safeParse(req.body);
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

      const input = parseResult.data;

      // 3. Ingest payment (idempotent)
      const result = await parishLedgerService.ingestWebhookPayment({
        userId: input.userId,
        category: input.category,
        amount: input.amount,
        currency: input.currency,
        method: input.method,
        referenceNumber: input.referenceNumber,
        targetPriestId: input.targetPriestId,
        rawPayload: req.body as Record<string, unknown>,
      });

      if (result.alreadyExists) {
        res.status(200).json({
          success: true,
          message: 'Payment reference already settled — idempotent response.',
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          id: result.entry?.id,
          referenceNumber: input.referenceNumber,
          category: input.category,
          amount: input.amount,
          currency: input.currency ?? 'ETB',
          createdAt: result.entry?.createdAt,
        },
        message: 'ክፍያ ተመዝግቧል — Payment recorded successfully.',
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * GET /api/v1/transactions/history
   *
   * Returns the authenticated user's complete parish payment history.
   * JWT authentication required — the userId is extracted from req.user.
   */
  async getMyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const history = await parishLedgerService.getFollowerHistory(userId);

      res.status(200).json({
        success: true,
        data: history,
        total: history.length,
        message: 'የክፍያ ታሪክ ተስተካክሏል — Payment history retrieved.',
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * GET /api/v1/treasury/ledger
   *
   * Returns all ParishLedger rows scoped to the TREASURER's institution.
   * Restricted to users where ecclesiasticalRole === TREASURER.
   */
  async getTreasuryLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.user!.institutionId;
      const ledger = await parishLedgerService.getTreasuryLedger(institutionId);

      res.status(200).json({
        success: true,
        data: ledger,
        total: ledger.length,
        message: 'የቤተ ክርስቲያን ግምጃ ቤት ሂሳብ — Treasury ledger retrieved.',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const parishLedgerController = new ParishLedgerController();
