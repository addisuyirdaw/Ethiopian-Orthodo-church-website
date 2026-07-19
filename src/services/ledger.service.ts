import {
  PaymentGateway,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import { toDecimal } from '../lib/decimal';
import { NotFoundError } from '../middleware/error-handler.middleware';
import { institutionRepository } from '../repositories/institution.repository';
import { financialTransactionRepository } from '../repositories/financial-transaction.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';
import {
  calculateHierarchicalSplits,
  validateSplitBalance,
} from './ledger-split.util';
import { paymentGatewayFactory } from './payment/payment-gateway.factory';
import { PaymentInitiationResult } from './payment/types';
import { AuthenticatedUser } from '../types';
import { isAdministrativeRole } from '../types';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';
import { ForbiddenError } from '../middleware/error-handler.middleware';
import { ListLedgerQuery } from '../validators/financial.validator';

export interface IncomingContributionInput {
  institutionId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  gateway: PaymentGateway;
  referenceId: string;
  actorId: string;
}

export interface ContributionResult {
  transaction: {
    id: string;
    institutionId: string;
    amount: string;
    currency: string;
    type: TransactionType;
    gateway: PaymentGateway;
    referenceId: string;
    status: TransactionStatus;
  };
  splits: Array<{
    id: string;
    destinationInstitutionId: string;
    splitAmount: string;
    percentageApplied: string;
  }>;
  payment: PaymentInitiationResult;
}

export class LedgerService {
  async processIncomingContribution(
    input: IncomingContributionInput,
  ): Promise<ContributionResult> {
    const institution = await institutionRepository.findById(input.institutionId);
    if (!institution) {
      throw new NotFoundError('Target institution not found.');
    }

    const existing = await financialTransactionRepository.findByReferenceId(
      input.referenceId,
    );
    if (existing) {
      throw new NotFoundError('A transaction with this reference ID already exists.');
    }

    const totalAmount = toDecimal(input.amount);
    const allocations = calculateHierarchicalSplits(institution, totalAmount);

    if (!validateSplitBalance(totalAmount, allocations)) {
      throw new Error('Split allocation does not balance to the total contribution amount.');
    }

    const paymentStrategy = paymentGatewayFactory.resolve(
      input.currency,
      input.gateway,
    );
    const payment = await paymentStrategy.initiatePayment(
      input.amount,
      input.currency,
      input.referenceId,
    );

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await financialTransactionRepository.create(
        {
          institutionId: input.institutionId,
          amount: totalAmount,
          currency: input.currency,
          type: input.type,
          gateway: input.gateway,
          referenceId: input.referenceId,
          status: TransactionStatus.COMPLETED,
        },
        tx,
      );

      const splits = [];
      for (const allocation of allocations) {
        const split = await financialTransactionRepository.createLedgerSplit(
          {
            financialTransactionId: transaction.id,
            destinationInstitutionId: allocation.institutionId,
            splitAmount: allocation.amount,
            percentageApplied: allocation.percentageApplied,
          },
          tx,
        );
        splits.push(split);
      }

      await auditLogRepository.create(
        {
          actorId: input.actorId,
          institutionId: input.institutionId,
          action: 'FINANCIAL_CONTRIBUTION',
          tableName: 'financial_transactions',
          recordId: transaction.id,
          changes: {
            after: {
              id: transaction.id,
              amount: ((transaction as any).amountInCents / 100).toString(),
              currency: transaction.currency,
              type: transaction.type,
              gateway: transaction.gateway,
              referenceId: transaction.referenceId,
              status: transaction.status,
              splits: splits.map((split) => ({
                destinationInstitutionId: split.destinationInstitutionId,
                splitAmount: split.splitAmount.toString(),
                percentageApplied: split.percentageApplied.toString(),
              })),
            },
          },
        },
        tx,
      );

      return { transaction, splits };
    });

    return {
      transaction: {
        id: result.transaction.id,
        institutionId: result.transaction.institutionId,
        amount: ((result.transaction as any).amountInCents / 100).toString(),
        currency: result.transaction.currency,
        type: result.transaction.type,
        gateway: result.transaction.gateway,
        referenceId: result.transaction.referenceId,
        status: result.transaction.status,
      },
      splits: result.splits.map((split) => ({
        id: split.id,
        destinationInstitutionId: split.destinationInstitutionId,
        splitAmount: split.splitAmount.toString(),
        percentageApplied: split.percentageApplied.toString(),
      })),
      payment,
    };
  }

  async listLedger(user: AuthenticatedUser, query: ListLedgerQuery) {
    if (query.institution_id) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        throw new ForbiddenError();
      }
      await assertInstitutionAccess(user, query.institution_id, false);
    }

    const isAdmin = isAdministrativeRole(user.ecclesiasticalRole);

    if (isAdmin) {
      const targetInstitutionId = query.institution_id ?? user.institutionId;
      const scopeInstitution = await institutionRepository.findById(targetInstitutionId);

      if (!scopeInstitution) {
        throw new NotFoundError('Institution scope not found.');
      }

      return financialTransactionRepository.findMany({
        hierarchyPathPrefix: scopeInstitution.hierarchyPath,
        type: query.type,
        status: query.status,
        page: query.page,
        limit: query.limit,
      });
    }

    return financialTransactionRepository.findMany({
      institutionId: user.institutionId,
      type: query.type,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }
}

export const ledgerService = new LedgerService();
