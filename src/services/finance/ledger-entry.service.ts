import { randomUUID } from 'crypto';
import { ContributionStatus, OfferingCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../lib/prisma';
import { toDecimal } from '../../lib/decimal';
import { NotFoundError } from '../../middleware/error-handler.middleware';

// ─── Input/Output Types ──────────────────────────────────────────────────────

export interface InitializeContributionInput {
  tenantId: string;
  amount: number;
  currency: string;
  category: OfferingCategory;
  gateway: string;
  vowDetails?: string;
  userId?: string;
}

export interface ContributionEntry {
  id: string;
  tenantId: string;
  donorUserId: string | null;
  amount: string;
  currency: string;
  category: OfferingCategory;
  paymentGateway: string;
  gatewayReference: string;
  status: ContributionStatus;
  vowDetails: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinalizedContributionResult {
  entry: ContributionEntry;
  /** Set when status transitioned to SETTLED */
  treasury?: {
    tenantId: string;
    category: OfferingCategory;
    settledAmount: string;
    currency: string;
    gatewayReference: string;
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class LedgerEntryService {
  /**
   * Creates a PENDING contribution record in the database.
   * Generates a unique internal gateway reference for tracking.
   */
  async initializeContribution(
    data: InitializeContributionInput,
  ): Promise<ContributionEntry> {
    const gatewayReference = `ECCTX-${data.gateway.toUpperCase()}-${randomUUID()}`;
    const decimalAmount: Decimal = toDecimal(data.amount);

    const entry = await prisma.ecclesiasticalTransaction.create({
      data: {
        tenantId: data.tenantId,
        donorUserId: data.userId ?? null,
        amount: decimalAmount,
        currency: data.currency,
        category: data.category,
        paymentGateway: data.gateway,
        gatewayReference,
        status: ContributionStatus.PENDING,
        vowDetails: data.vowDetails ?? null,
      },
    });

    return this._serialize(entry);
  }

  /**
   * Finalizes an existing contribution. Executes inside a Prisma transaction
   * to ensure atomicity. Idempotent: repeated SETTLED calls are no-ops.
   */
  async finalizeContribution(
    gatewayRef: string,
    finalStatus: ContributionStatus,
  ): Promise<FinalizedContributionResult> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.ecclesiasticalTransaction.findUnique({
        where: { gatewayReference: gatewayRef },
      });

      if (!existing) {
        throw new NotFoundError(
          `EcclesiasticalTransaction with gatewayReference "${gatewayRef}" not found.`,
        );
      }

      // Idempotency guard: if already SETTLED, return as-is with no further writes.
      if (existing.status === ContributionStatus.SETTLED) {
        return { entry: this._serialize(existing) };
      }

      const updated = await tx.ecclesiasticalTransaction.update({
        where: { id: existing.id },
        data: { status: finalStatus },
      });

      const result: FinalizedContributionResult = { entry: this._serialize(updated) };

      // Provision parish treasury ledger when a contribution is settled.
      if (finalStatus === ContributionStatus.SETTLED) {
        result.treasury = {
          tenantId: updated.tenantId,
          category: updated.category,
          settledAmount: updated.amount.toFixed(4),
          currency: updated.currency,
          gatewayReference: updated.gatewayReference,
        };
      }

      return result;
    });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private _serialize(
    record: Awaited<ReturnType<typeof prisma.ecclesiasticalTransaction.create>>,
  ): ContributionEntry {
    return {
      id: record.id,
      tenantId: record.tenantId,
      donorUserId: record.donorUserId,
      amount: record.amount.toFixed(4),
      currency: record.currency,
      category: record.category,
      paymentGateway: record.paymentGateway,
      gatewayReference: record.gatewayReference,
      status: record.status,
      vowDetails: record.vowDetails,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const ledgerEntryService = new LedgerEntryService();
