import { randomUUID } from 'crypto';
import { PaymentGateway, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import { toDecimal } from '../lib/decimal';
import { institutionRepository } from '../repositories/institution.repository';
import { financialTransactionRepository } from '../repositories/financial-transaction.repository';
import { paymentGatewayFactory } from './payment/payment-gateway.factory';
import { calculateHierarchicalSplits, validateSplitBalance } from './ledger-split.util';
import { NotFoundError } from '../middleware/error-handler.middleware';
import { PublicDonateInput } from '../validators/public-payment.validator';
import { PaymentInitiationResult } from './payment/types';

// ── Holy Synod canonical split constants (as defined by the Roadmap spec) ────
// Parish  → 90 %  (direct allocation to the target institution)
// Central → 10 %  (canonical tithe to the Holy Synod Patriarchate apex)
// The existing `calculateHierarchicalSplits` util implements the full
// hierarchical split (3 % patriarchate, 7 % diocese, 90 % parish).
// We re-use that algorithm here since it is already canonically correct.

/** Unique transaction reference formatted as required: OC-TXN-<UUID> */
export function generateOcTxnReference(): string {
  return `OC-TXN-${randomUUID()}`;
}

// ── Contribution type mapping ─────────────────────────────────────────────────
const CONTRIBUTION_TYPE_MAP: Record<string, TransactionType> = {
  TITHE: 'TITHE',
  VOW: 'DONATION', // VOW maps to DONATION in the Prisma enum (OFFERING doesn't exist)
  MONASTIC_AID: 'DONATION',
  GENERAL: 'DONATION',
};

function resolveTransactionType(contributionType: string): TransactionType {
  return (CONTRIBUTION_TYPE_MAP[contributionType] as TransactionType) ?? 'DONATION';
}

function resolveGatewayEnum(gateway: string): PaymentGateway {
  const upper = gateway.toUpperCase();
  if (upper === 'CHAPA') return PaymentGateway.CHAPA;
  if (upper === 'TELEBIRR') return PaymentGateway.TELEBIRR;
  return PaymentGateway.MANUAL_CASH;
}

// ── Service interfaces ────────────────────────────────────────────────────────

export interface PublicDonationResult {
  txnReference: string;
  gatewayUrl: string;
  institution: {
    id: string;
    name: string;
  };
  splits: Array<{
    destinationInstitutionId: string;
    splitAmount: string;
    percentageApplied: string;
  }>;
}

export interface PublicWebhookSettlementResult {
  txnId: string;
  txnReference: string;
  status: string;
  parishShare: string;
  patriarchateShare: string;
}

// ── Core donation initiation service ─────────────────────────────────────────

/**
 * Initiates a public (unauthenticated) lay donation.
 *
 * Flow:
 * 1. Resolve the target institution; validate it is active.
 * 2. Compute canonical hierarchical fund splits (90/7/3 algorithm).
 * 3. Generate a unique OC-TXN-* reference.
 * 4. Persist the FinancialTransaction record (status = PENDING).
 * 5. Call the selected payment gateway to obtain a checkout URL.
 * 6. Return the gateway redirect URL to the controller.
 */
export async function initiatePublicDonation(
  input: PublicDonateInput,
): Promise<PublicDonationResult> {
  // 1. Resolve the target institution
  const institution = await institutionRepository.findById(input.targetTenantId);
  if (!institution) {
    throw new NotFoundError(
      `Institution with ID ${input.targetTenantId} was not found.`,
    );
  }

  // 2. Compute canonical hierarchical splits
  const totalAmount = toDecimal(input.amount);
  const allocations = calculateHierarchicalSplits(institution, totalAmount);

  if (!validateSplitBalance(totalAmount, allocations)) {
    throw new Error(
      'Internal split calculation error: allocated amounts do not sum to the total.',
    );
  }

  // 3. Generate canonical transaction reference
  const txnReference = generateOcTxnReference();

  // 4. Resolve gateway + initiate payment
  const gatewayEnum = resolveGatewayEnum(input.gateway);
  const paymentStrategy = paymentGatewayFactory.resolveByGateway(gatewayEnum);

  let payment: PaymentInitiationResult;
  try {
    payment = await paymentStrategy.initiatePayment(
      input.amount,
      input.currency,
      txnReference,
    );
  } catch (err) {
    throw new Error(
      `Payment gateway error (${input.gateway}): ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const txnType = resolveTransactionType(input.contributionType);

  // 5. Persist transaction + splits atomically
  const result = await prisma.$transaction(
    async (tx) => {
      const transaction = await financialTransactionRepository.create(
        {
          institutionId: input.targetTenantId,
          amount: totalAmount,
          currency: input.currency,
          type: txnType,
          gateway: gatewayEnum,
          referenceId: txnReference,
          status: TransactionStatus.PENDING,
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

      return { transaction, splits };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  // 6. Return result (no internal IDs or raw DB objects exposed)
  return {
    txnReference,
    gatewayUrl: payment.gatewayUrl,
    institution: {
      id: institution.id,
      name: institution.name,
    },
    splits: result.splits.map((s) => ({
      destinationInstitutionId: s.destinationInstitutionId,
      splitAmount: s.splitAmount.toString(),
      percentageApplied: s.percentageApplied.toString(),
    })),
  };
}

// ── Webhook settlement service ────────────────────────────────────────────────

/**
 * Processes an inbound payment-gateway webhook notification.
 *
 * Flow:
 * 1. Locate the FinancialTransaction by its OC-TXN-* reference.
 * 2. Update status to SUCCESS (or FAILED).
 * 3. Compute the simplified canonical split summary for the response:
 *    - 90 % parish allocation (leaf institution)
 *    - 10 % central Holy Synod allocation (patriarchate apex)
 *    (Note: the detailed 90/7/3 splits are already stored in LedgerSplitRecord;
 *     the 90/10 described here is the high-level "parish vs. central" view.)
 */
export async function settlePublicDonationWebhook(
  txnReference: string,
  gatewayStatus: 'SUCCESS' | 'FAILED' | 'PENDING',
): Promise<PublicWebhookSettlementResult> {
  // 1. Locate transaction
  const transaction = await financialTransactionRepository.findByReferenceId(txnReference);
  if (!transaction) {
    throw new NotFoundError(
      `No donation record found for reference: ${txnReference}`,
    );
  }

  // Map gateway status to Prisma enum
  const newStatus: TransactionStatus =
    gatewayStatus === 'SUCCESS'
      ? TransactionStatus.COMPLETED
      : gatewayStatus === 'FAILED'
      ? TransactionStatus.FAILED
      : TransactionStatus.PENDING;

  // 2. Update transaction status
  await prisma.financialTransaction.update({
    where: { id: transaction.id },
    data: { status: newStatus },
  });

  // 3. Compute the canonical 90 / 10 split summary for audit response
  // Prefer the Decimal `amount` field; fall back to legacy amountInCents (integer cents → ETB)
  const rawAmount = (transaction as any).amount;
  const total = rawAmount != null
    ? new Decimal(rawAmount.toString())
    : new Decimal(((transaction as any).amountInCents / 100).toString());
  const parishShare = total.mul(new Decimal('0.90'));
  const patriarchateShare = total.sub(parishShare);

  return {
    txnId: transaction.id,
    txnReference,
    status: newStatus,
    parishShare: parishShare.toFixed(4),
    patriarchateShare: patriarchateShare.toFixed(4),
  };
}
