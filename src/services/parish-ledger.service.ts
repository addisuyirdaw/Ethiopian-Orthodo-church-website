import { ParishLedgerCategory, ParishPaymentMethod, Prisma } from '@prisma/client';
import {
  parishLedgerRepository,
  CreateParishLedgerData,
} from '../repositories/parish-ledger.repository';

// ── Constants ────────────────────────────────────────────────────────────────
/** Number of days without an ASRAT payment before 'DELAYED' flag is applied. */
const ASRAT_DELAY_THRESHOLD_DAYS = 30;

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface WebhookIngestionInput {
  userId: string;
  category: ParishLedgerCategory;
  amount: number | string;
  currency?: string;
  method: ParishPaymentMethod;
  referenceNumber: string;
  targetPriestId?: string | null;
  rawPayload?: Record<string, unknown> | null;
}

export interface FollowerProfile {
  id: string;
  fullName: string;
  email: string;
  nameAm: string | null;
  nameGez: string | null;
  sex: string | null;
  location: string | null;
  institutionId: string;
  ecclesiasticalRole: string;
  /** ISO date-string of their last ASRAT payment, or null if none. */
  lastAsratDate: string | null;
  /** Injected by service layer — present if ASRAT payment is overdue. */
  paymentStatus?: 'DELAYED';
}

// ── Service class ─────────────────────────────────────────────────────────────

export class ParishLedgerService {
  /**
   * Ingest a verified gateway webhook payment and persist to ParishLedger.
   * Idempotent: if the referenceNumber already exists, the existing record
   * is returned without creating a duplicate.
   */
  async ingestWebhookPayment(input: WebhookIngestionInput) {
    // Idempotency check
    const alreadyExists = await parishLedgerRepository.existsByReferenceNumber(
      input.referenceNumber,
    );
    if (alreadyExists) {
      return { alreadyExists: true };
    }

    const data: CreateParishLedgerData = {
      userId: input.userId,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      referenceNumber: input.referenceNumber,
      targetPriestId: input.targetPriestId,
      rawPayload: (input.rawPayload ?? null) as Prisma.InputJsonValue | null,
    };

    const entry = await parishLedgerRepository.create(data);
    return { alreadyExists: false, entry };
  }

  /**
   * Return the full contribution history for an authenticated follower.
   */
  async getFollowerHistory(userId: string) {
    const rows = await parishLedgerRepository.findByUserId(userId);
    return rows.map((row) => ({
      id: row.id,
      category: row.category,
      amount: row.amount.toString(),
      currency: row.currency,
      method: row.method,
      referenceNumber: row.referenceNumber,
      targetPriest: row.targetPriest
        ? { id: row.targetPriest.id, fullName: row.targetPriest.fullName }
        : null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * Return all ParishLedger rows for a given institution — Treasurer view.
   * Includes donor user and optional target priest.
   */
  async getTreasuryLedger(institutionId: string) {
    const rows = await parishLedgerRepository.findAllForInstitution(institutionId);
    return rows.map((row) => ({
      id: row.id,
      user: {
        id: row.user.id,
        fullName: row.user.fullName,
        email: row.user.email,
        role: row.user.ecclesiasticalRole,
      },
      category: row.category,
      amount: row.amount.toString(),
      currency: row.currency,
      method: row.method,
      referenceNumber: row.referenceNumber,
      targetPriest: row.targetPriest
        ? { id: row.targetPriest.id, fullName: row.targetPriest.fullName }
        : null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /**
   * Return followers of a specific priest with automated ASRAT delay badge.
   *
   * Automation rule: if a follower's most recent ASRAT ledger entry is older
   * than ASRAT_DELAY_THRESHOLD_DAYS (30 days) — or they have never paid —
   * inject `paymentStatus: 'DELAYED'` into their profile object.
   */
  async getPriestFollowers(priestId: string): Promise<FollowerProfile[]> {
    const followers = await parishLedgerRepository.findFollowersByPriestId(priestId);
    const now = Date.now();

    return followers.map((follower) => {
      const latestAsrat = follower.parishLedgerEntries[0] ?? null;
      const lastAsratDate = latestAsrat ? latestAsrat.createdAt.toISOString() : null;

      let paymentStatus: 'DELAYED' | undefined;

      if (!latestAsrat) {
        // Never paid — automatically delayed
        paymentStatus = 'DELAYED';
      } else {
        const daysSinceLastPayment =
          (now - latestAsrat.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPayment > ASRAT_DELAY_THRESHOLD_DAYS) {
          paymentStatus = 'DELAYED';
        }
      }

      return {
        id: follower.id,
        fullName: follower.fullName,
        email: follower.email,
        nameAm: follower.nameAm,
        nameGez: follower.nameGez,
        sex: follower.sex,
        location: follower.location,
        institutionId: follower.institutionId,
        ecclesiasticalRole: follower.ecclesiasticalRole,
        lastAsratDate,
        ...(paymentStatus ? { paymentStatus } : {}),
      };
    });
  }
}

export const parishLedgerService = new ParishLedgerService();
