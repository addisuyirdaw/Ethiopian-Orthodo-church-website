import { CatechismStatus, CounselingType, EcclesiasticalRole } from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  CanonicalValidationError,
} from '../../middleware/error-handler.middleware';

// ─── Allowed catechism state-machine transitions ───────────────────────────────

const CATECHISM_TRANSITIONS: Record<CatechismStatus, CatechismStatus[]> = {
  [CatechismStatus.ENROLLED]:          [CatechismStatus.INSTRUCTION],
  [CatechismStatus.INSTRUCTION]:       [CatechismStatus.EXAMINATION],
  [CatechismStatus.EXAMINATION]:       [CatechismStatus.READY_FOR_BAPTISM],
  [CatechismStatus.READY_FOR_BAPTISM]: [CatechismStatus.BAPTIZED],
  [CatechismStatus.BAPTIZED]:          [],
};

// ─── Clergy roles that are permitted to act as spiritual fathers ───────────────

const PASTORAL_ROLES: readonly EcclesiasticalRole[] = [
  EcclesiasticalRole.PATRIARCH,
  EcclesiasticalRole.ARCHBISHOP,
  EcclesiasticalRole.METROPOLITAN,
  EcclesiasticalRole.BISHOP,
  EcclesiasticalRole.PRIEST,
];

function isPastoralRole(role: EcclesiasticalRole): boolean {
  return (PASTORAL_ROLES as readonly string[]).includes(role);
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface LogCounselingInput {
  rosterId: string;
  date: Date;
  type: CounselingType;
  isCanonFulfilled: boolean;
  encryptedNextSteps?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class PastoralCrmService {
  /**
   * Establishes a spiritual-father/child relationship within a tenant.
   *
   * Guards:
   *  1. Both users must exist and not be soft-deleted.
   *  2. The priest must hold a pastoral ecclesiastical role.
   *  3. The mapping must not already exist (ConflictError on duplicate).
   */
  async addSpiritualChild(tenantId: string, priestId: string, childId: string) {
    // ── Guard 1: verify both users exist ──────────────────────────────────────
    const [priest, child] = await Promise.all([
      prisma.user.findFirst({ where: { id: priestId, deletedAt: null } }),
      prisma.user.findFirst({ where: { id: childId,  deletedAt: null } }),
    ]);

    if (!priest) {
      throw new NotFoundError(`የካህን ተጠቃሚ "${priestId}" አልተገኘም።`);
    }
    if (!child) {
      throw new NotFoundError(`የምእመን ተጠቃሚ "${childId}" አልተገኘም።`);
    }

    // ── Guard 2: priest must hold a pastoral role ────────────────────────────
    if (!isPastoralRole(priest.ecclesiasticalRole)) {
      throw new CanonicalValidationError(
        `ተጠቃሚ "${priestId}" የካህን ሚና የለውም። መንፈሳዊ አባት ለመሆን ካህን ወይም ዲቁና ያለ ሰው መሆን አለበት።`,
      );
    }

    // ── Guard 3: prevent duplicate roster entry ───────────────────────────────
    const existing = await prisma.spiritualRoster.findUnique({
      where: { priestUserId_spiritualChildUserId: { priestUserId: priestId, spiritualChildUserId: childId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError(
        `ይህ ምእመን "${childId}" ከዚህ ካህን "${priestId}" ጋር ቀድሞ ተስፋ ተሰጥቶታል።`,
      );
    }

    return prisma.spiritualRoster.create({
      data: { tenantId, priestUserId: priestId, spiritualChildUserId: childId },
      include: {
        priest:         { select: { id: true, fullName: true, ecclesiasticalRole: true } },
        spiritualChild: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Logs a pastoral counseling session against an existing SpiritualRoster.
   *
   * The executing priestId is cross-checked against the roster's owner —
   * preventing cross-priest mutation of confession metadata.
   *
   * @throws ForbiddenError when priestId ≠ roster.priestUserId
   */
  async logCounselingSession(priestId: string, data: LogCounselingInput) {
    const roster = await prisma.spiritualRoster.findUnique({
      where: { id: data.rosterId },
      select: { id: true, priestUserId: true },
    });

    if (!roster) {
      throw new NotFoundError(`የመንፈሳዊ አሰፋፈር ዝርዝር "${data.rosterId}" አልተገኘም።`);
    }

    // Strict ownership check: only the assigned spiritual father may log
    if (roster.priestUserId !== priestId) {
      throw new ForbiddenError(
        'ይህ ዝርዝር ለሌላ ካህን የተመደበ ነው። ሌሎች ካህናት የምስጢረ ክህነት ዝርዝሮችን ማስገባት አይፈቀድም።',
      );
    }

    return prisma.pastoralCounselingLog.create({
      data: {
        rosterId:           data.rosterId,
        date:               data.date,
        type:               data.type,
        isCanonFulfilled:   data.isCanonFulfilled,
        encryptedNextSteps: data.encryptedNextSteps ?? null,
      },
    });
  }

  /**
   * Advances a CatechumenRecord through its status state machine.
   *
   * Validated transitions (linear):
   *   ENROLLED → INSTRUCTION → EXAMINATION → READY_FOR_BAPTISM → BAPTIZED
   *
   * The BAPTIZED transition is wrapped in a serializable transaction to ensure
   * safety rules are enforced atomically and no concurrent advancement races.
   *
   * @throws NotFoundError  when the record does not belong to the given tenant
   * @throws CanonicalValidationError when the target transition is not allowed
   */
  async advanceCatechumen(
    tenantId: string,
    recordId: string,
    targetStatus: CatechismStatus,
  ) {
    // Scoped lookup: ensures the record belongs to this tenant
    const record = await prisma.catechumenRecord.findFirst({
      where: { id: recordId, tenantId },
    });

    if (!record) {
      throw new NotFoundError(
        `የምርቃናዊ ዝርዝር "${recordId}" ለዚህ ተቋም አልተገኘም።`,
      );
    }

    const allowed = CATECHISM_TRANSITIONS[record.status];
    if (!allowed.includes(targetStatus)) {
      throw new CanonicalValidationError(
        `ሁኔታ ከ "${record.status}" ወደ "${targetStatus}" ሊቀየር አይችልም። ዝርዝሩ ቅደም ተከተሉን መጠበቅ አለበት።`,
      );
    }

    // Wrap BAPTIZED transition in a serializable transaction for safety
    if (targetStatus === CatechismStatus.BAPTIZED) {
      return prisma.$transaction(
        async (tx) => {
          // Re-fetch inside the transaction to prevent TOCTOU race
          const fresh = await tx.catechumenRecord.findUnique({ where: { id: recordId } });
          if (!fresh || !CATECHISM_TRANSITIONS[fresh.status].includes(targetStatus)) {
            throw new CanonicalValidationError(
              'ወደ ምዕመን ሁኔታ ለማሸጋሸግ ቅድመ ሁኔታዎች አልተሟሉም።',
            );
          }
          return tx.catechumenRecord.update({
            where: { id: recordId },
            data:  { status: targetStatus },
          });
        },
        { isolationLevel: 'Serializable' },
      );
    }

    return prisma.catechumenRecord.update({
      where: { id: recordId },
      data:  { status: targetStatus },
    });
  }

  /**
   * Lists all SpiritualRoster entries for a given priest within a tenant.
   */
  async listRosterByPriest(tenantId: string, priestId: string) {
    return prisma.spiritualRoster.findMany({
      where:   { tenantId, priestUserId: priestId },
      orderBy: { establishedAt: 'desc' },
      include: {
        spiritualChild: { select: { id: true, fullName: true, email: true } },
        counselingLogs: {
          orderBy: { date: 'desc' },
          take:    5,
          select:  { id: true, date: true, type: true, isCanonFulfilled: true },
        },
      },
    });
  }

  /**
   * Lists all CatechumenRecord entries scoped to a tenant.
   */
  async listCatechumens(tenantId: string, status?: CatechismStatus) {
    return prisma.catechumenRecord.findMany({
      where:   { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        catechumen:     { select: { id: true, fullName: true, email: true } },
        assignedPriest: { select: { id: true, fullName: true } },
      },
    });
  }
}

export const pastoralCrmService = new PastoralCrmService();
