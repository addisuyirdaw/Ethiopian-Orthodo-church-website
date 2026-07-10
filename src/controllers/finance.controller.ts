import { Request, Response } from 'express';
import { ledgerEntryService } from '../services/finance/ledger-entry.service';
import {
  initializeContributionSchema,
  finalizeContributionWebhookSchema,
} from '../validators/finance.validator';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { isAdministrativeRole } from '../types';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';

export class FinanceController {
  /**
   * POST /api/v1/finance/contributions/initialize
   *
   * Authenticated endpoint to initialize a new PENDING contribution record.
   * Scopes the tenantId to the authenticated user's institution by default.
   * Administrative roles may specify an explicit institutionId override.
   */
  async initialize(req: Request, res: Response): Promise<void> {
    const input = initializeContributionSchema.parse(req.body);
    const user = req.user!;

    // Resolve tenant/institution context
    const tenantId = input.institutionId ?? user.institutionId;

    // Non-admins cannot post on behalf of another institution
    if (tenantId !== user.institutionId) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        throw new ForbiddenError('Unauthorized institution access.');
      }
      await assertInstitutionAccess(user, tenantId, false);
    }

    const result = await ledgerEntryService.initializeContribution({
      tenantId,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      gateway: input.gateway,
      vowDetails: input.vowDetails,
      userId: input.userId ?? user.id,
    });

    res.status(201).json({
      data: result,
      message: 'Contribution initialized successfully.',
    });
  }

  /**
   * POST /api/v1/finance/webhooks/:gateway
   *
   * Public webhook endpoint to process gateway payment status callbacks.
   * Secured via the `x-webhook-signature` header checked against
   * WEBHOOK_SECRET environment variable.
   */
  async webhook(req: Request, res: Response): Promise<void> {
    const { gateway } = req.params;

    // Signature-based webhook authentication
    const signature = req.headers['x-webhook-signature'];
    const expectedSecret = process.env.WEBHOOK_SECRET ?? 'test-webhook-secret';
    if (!signature || signature !== expectedSecret) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature.',
      });
      return;
    }

    const input = finalizeContributionWebhookSchema.parse(req.body);

    const result = await ledgerEntryService.finalizeContribution(
      input.gatewayReference,
      input.status,
    );

    res.status(200).json({
      data: result,
      message: `Webhook for gateway '${gateway}' processed successfully.`,
    });
  }
}

export const financeController = new FinanceController();
