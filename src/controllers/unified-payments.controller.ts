import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { merchantConfigSchema, initiatePaymentSchema, paymentWebhookSchema } from '../validators/unified-payments.validator';
import { unifiedPaymentsService } from '../services/unified-payments.service';

const WEBHOOK_SECRET =
  process.env.UNIFIED_PAYMENTS_WEBHOOK_SECRET ??
  process.env.DONATION_WEBHOOK_SECRET ??
  'development-donation-webhook-secret';

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
    return false;
  }
}

export class UnifiedPaymentsController {
  async configureMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = merchantConfigSchema.safeParse(req.body);
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

      const result = await unifiedPaymentsService.configureMerchant(
        parseResult.data.institutionId,
        parseResult.data
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMerchantConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { institutionId } = req.params;
      if (!institutionId) {
        res.status(400).json({ error: 'Bad Request', message: 'institutionId is required.' });
        return;
      }

      const result = await unifiedPaymentsService.getMerchantConfig(institutionId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = initiatePaymentSchema.safeParse(req.body);
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

      const userId = req.user?.id ?? parseResult.data.userId ?? null;

      const result = await unifiedPaymentsService.initiatePayment(
        userId,
        parseResult.data.institutionId,
        parseResult.data
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-signature'];
      if (!signature || typeof signature !== 'string') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing x-signature header. Webhook calls must be signed.',
        });
        return;
      }

      const rawBody = req.rawBody ?? Buffer.alloc(0);
      if (!verifyWebhookSignature(rawBody, signature)) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Webhook signature verification failed.',
        });
        return;
      }

      const parseResult = paymentWebhookSchema.safeParse(req.body);
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

      const result = await unifiedPaymentsService.settleWebhook(
        parseResult.data.txnReference,
        parseResult.data.status
      );

      res.status(200).json({
        success: true,
        data: {
          transactionId: result.id,
          providerRef: result.providerRef,
          status: result.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.params.institutionId ?? req.query.institutionId ?? req.user?.institutionId;
      if (!institutionId || typeof institutionId !== 'string') {
        res.status(400).json({ error: 'Bad Request', message: 'institutionId is required.' });
        return;
      }

      const result = await unifiedPaymentsService.getTransactionHistory(institutionId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const unifiedPaymentsController = new UnifiedPaymentsController();
