import { PaymentGateway, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../lib/prisma';
import { toDecimal } from '../../lib/decimal';

// ── Split Constants ────────────────────────────────────────────────────────────
// Parish:       70 %  — primary receiving institution
// Diocese:      24 %  — immediate hierarchical parent tier
// Patriarchate:  5 %  — universal canonical apex
// Platform:      1 %  — OrthodoxConnect SaaS operational margin
// ─────────────────────────────────────────────────────────────────────────────
const CLEARING_SPLITS = {
  PARISH: new Decimal('0.70'),
  DIOCESE: new Decimal('0.24'),
  PATRIARCHATE: new Decimal('0.05'),
  PLATFORM: new Decimal('0.01'),
} as const;

export interface SettlementPayload {
  reference: string;
  amount: number;
  currency: string;
  tenantId: string;
  gateway: string;
}

export interface SettlementResult {
  id: string;
  referenceNumber: string;
  totalAmount: Decimal;
  parishShare: Decimal;
  dioceseShare: Decimal;
  patriarchateShare: Decimal;
  platformFee: Decimal;
  status: string;
  createdAt: Date;
}

/**
 * Processes an inbound payment settlement notification.
 *
 * Runs inside a Serializable transaction so that concurrent webhook deliveries
 * for the same reference number are safely rejected by the DB-level UNIQUE
 * constraint on `reference_number` rather than silently double-settling.
 *
 * @param payload  Validated fields extracted from the payment gateway webhook.
 * @returns        The persisted FinancialClearingLog entry with all split fields.
 * @throws         Prisma P2002 on duplicate reference; re-thrown to controller.
 */
export async function processIncomingSettlement(
  payload: SettlementPayload,
): Promise<SettlementResult> {
  const { reference, amount, currency, tenantId, gateway } = payload;

  const total = toDecimal(amount);

  // Four-way split calculation — all using exact Decimal arithmetic so that
  // 0.70 + 0.24 + 0.05 + 0.01 === 1.00 with zero floating-point drift.
  const parishShare = total.mul(CLEARING_SPLITS.PARISH);
  const dioceseShare = total.mul(CLEARING_SPLITS.DIOCESE);
  const patriarchateShare = total.mul(CLEARING_SPLITS.PATRIARCHATE);

  // Platform fee is derived as the remainder to guarantee the four shares
  // sum exactly to `total`, avoiding rounding residual.
  const platformFee = total
    .sub(parishShare)
    .sub(dioceseShare)
    .sub(patriarchateShare);

  const resolvedGateway = resolveGateway(gateway);

  const log = await prisma.$transaction(
    async (tx) => {
      return tx.financialClearingLog.create({
        data: {
          tenantId,
          referenceNumber: reference,
          totalAmount: total,
          currency,
          gateway: resolvedGateway,
          parishShare,
          dioceseShare,
          patriarchateShare,
          platformFee,
          status: 'SETTLED',
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return {
    id: log.id,
    referenceNumber: log.referenceNumber,
    totalAmount: log.totalAmount,
    parishShare: log.parishShare,
    dioceseShare: log.dioceseShare,
    patriarchateShare: log.patriarchateShare,
    platformFee: log.platformFee,
    status: log.status,
    createdAt: log.createdAt,
  };
}

/**
 * Maps an arbitrary gateway string from the webhook payload to the canonical
 * `PaymentGateway` enum.  Defaults to `MANUAL_CASH` for unrecognised values
 * so that no record is ever dropped due to a gateway mismatch.
 */
function resolveGateway(raw: string): PaymentGateway {
  const upper = raw.toUpperCase() as PaymentGateway;
  const valid: PaymentGateway[] = [
    'TELEBIRR',
    'CBE_BIRR',
    'STRIPE',
    'MANUAL_CASH',
    'CHAPA',
  ];
  return valid.includes(upper) ? upper : 'MANUAL_CASH';
}
