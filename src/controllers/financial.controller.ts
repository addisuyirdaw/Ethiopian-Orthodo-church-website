import { Request, Response } from 'express';
import { ledgerService } from '../services/ledger.service';
import { contributeSchema, listLedgerQuerySchema } from '../validators/financial.validator';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { isAdministrativeRole } from '../types';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';

export class FinancialController {
  async contribute(req: Request, res: Response): Promise<void> {
    const input = contributeSchema.parse(req.body);
    const user = req.user!;

    const targetInstitutionId = input.institutionId ?? user.institutionId;

    if (targetInstitutionId !== user.institutionId) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        throw new ForbiddenError();
      }
      await assertInstitutionAccess(user, targetInstitutionId, false);
    }

    const result = await ledgerService.processIncomingContribution({
      institutionId: targetInstitutionId,
      amount: input.amount,
      currency: input.currency,
      type: input.type,
      gateway: input.gateway,
      referenceId: input.referenceId,
      actorId: user.id,
    });

    res.status(201).json({
      data: result,
      message: 'Contribution processed and ledger splits recorded.',
    });
  }

  async listLedger(req: Request, res: Response): Promise<void> {
    const query = listLedgerQuerySchema.parse(req.query);
    const { transactions, total } = await ledgerService.listLedger(req.user!, query);

    res.status(200).json({
      data: transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }
}

export const financialController = new FinancialController();
