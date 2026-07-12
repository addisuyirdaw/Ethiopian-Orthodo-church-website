import { Decimal } from '@prisma/client/runtime/library';
import { ParishLedgerCategory, ParishPaymentMethod, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateParishLedgerData {
  userId: string;
  category: ParishLedgerCategory;
  amount: number | string;
  currency?: string;
  method: ParishPaymentMethod;
  referenceNumber: string;
  targetPriestId?: string | null;
  rawPayload?: Prisma.InputJsonValue | null;
}

export class ParishLedgerRepository {
  /**
   * Create a new parish ledger entry from a verified payment webhook.
   */
  async create(data: CreateParishLedgerData) {
    return prisma.parishLedger.create({
      data: {
        userId: data.userId,
        category: data.category,
        amount: new Decimal(String(data.amount)),
        currency: data.currency ?? 'ETB',
        method: data.method,
        referenceNumber: data.referenceNumber,
        targetPriestId: data.targetPriestId ?? null,
        rawPayload: (data.rawPayload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, ecclesiasticalRole: true },
        },
        targetPriest: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * All ledger entries for a single user (follower payment history).
   */
  async findByUserId(userId: string) {
    return prisma.parishLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        targetPriest: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  /**
   * All ledger entries scoped to an institution's users (treasurer view).
   */
  async findAllForInstitution(institutionId: string) {
    return prisma.parishLedger.findMany({
      where: {
        user: { institutionId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            ecclesiasticalRole: true,
            institutionId: true,
          },
        },
        targetPriest: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  /**
   * Latest ASRAT entry for a user — used for payment delay calculation.
   */
  async findLatestAsratByUserId(userId: string) {
    return prisma.parishLedger.findFirst({
      where: { userId, category: 'ASRAT' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check whether a referenceNumber already exists (idempotency guard).
   */
  async existsByReferenceNumber(referenceNumber: string): Promise<boolean> {
    const count = await prisma.parishLedger.count({
      where: { referenceNumber },
    });
    return count > 0;
  }

  /**
   * All followers (User records) whose spiritualFatherId === priestId.
   * Returns user with their latest ASRAT ledger entry for delay detection.
   */
  async findFollowersByPriestId(priestId: string) {
    return prisma.user.findMany({
      where: {
        spiritualFatherId: priestId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        nameAm: true,
        nameGez: true,
        sex: true,
        location: true,
        institutionId: true,
        ecclesiasticalRole: true,
        parishLedgerEntries: {
          where: { category: 'ASRAT' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, amount: true, referenceNumber: true },
        },
      },
    });
  }
}

export const parishLedgerRepository = new ParishLedgerRepository();
