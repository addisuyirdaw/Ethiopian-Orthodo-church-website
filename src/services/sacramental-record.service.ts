import { AuthenticatedUser } from '../types';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';
import {
  ForbiddenError,
  NotFoundError,
  CanonicalValidationError,
  SealedRecordError,
} from '../middleware/error-handler.middleware';
import { sacramentalRecordRepository } from '../repositories/sacramental-record.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';
import { institutionRepository } from '../repositories/institution.repository';
import prisma from '../lib/prisma';
import { Prisma, FastingTier, SacramentalType } from '@prisma/client';
import {
  CreateSacramentInput,
  ListSacramentsQuery,
} from '../validators/sacrament.validator';
import { isAdministrativeRole } from '../types';
import { calendarService } from './calendar.service';
import { clergyLedgerService } from './clergy/clergy-ledger.service';

/**
 * Checks whether a SacramentalRecord has an active cryptographic seal.
 * If a seal exists, throws SealedRecordError — the record is immutable.
 * Call this guard before any UPDATE or DELETE operation on a record.
 */
async function guardAgainstSealed(recordId: string): Promise<void> {
  const seal = await prisma.sacramentSeal.findUnique({
    where: { sacramentalRecordId: recordId },
    select: { id: true },
  });
  if (seal) {
    throw new SealedRecordError(recordId);
  }
}


export class SacramentalRecordService {
  async create(user: AuthenticatedUser, input: CreateSacramentInput) {
    const institutionId = user.institutionId;

    // ── Step 1: Verify clergy canonical status ────────────────────────────
    // Must run before any DB writes. Throws CanonicalStatusException with
    // Amharic-first error payload when the celebrant is not in active standing.
    await clergyLedgerService.verifyClergySacramentalAuthority(input.celebrantPriestId);

    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError('Institution not found.');
    }

    const celebrant = await prisma.user.findFirst({
      where: {
        id: input.celebrantPriestId,
        institutionId,
        deletedAt: null,
      },
    });

    if (!celebrant) {
      throw new NotFoundError('Celebrant priest not found in this institution.');
    }

    if (input.type === SacramentalType.MARRIAGE) {
      const eventDateIso = input.eventDateUtc.slice(0, 10);
      const liturgicalContext = await calendarService.getDailyLiturgicalContext(
        institutionId,
        eventDateIso,
      );
      if (liturgicalContext.fasting.tier !== FastingTier.NONE) {
        throw new CanonicalValidationError('Marriage is not permitted during fasting periods.');
      }
    }

    if (input.targetUserId) {
      const target = await prisma.user.findFirst({
        where: {
          id: input.targetUserId,
          deletedAt: null,
        },
      });

      if (!target) {
        throw new NotFoundError('Target user not found.');
      }
    }

    const record = await prisma.$transaction(async (tx) => {
      const created = await sacramentalRecordRepository.create(
        {
          type: input.type,
          christianName: input.christianName,
          sponsorName: input.sponsorName ?? null,
          eventDateUtc: new Date(input.eventDateUtc),
          calendarMetadata: input.calendarMetadata as Prisma.InputJsonValue,
          isCanonicalVerified: input.isCanonicalVerified ?? false,
          institution: { connect: { id: institutionId } },
          celebrantPriest: { connect: { id: input.celebrantPriestId } },
          ...(input.targetUserId
            ? { targetUser: { connect: { id: input.targetUserId } } }
            : {}),
        },
        tx,
      );

      await auditLogRepository.create(
        {
          actorId: user.id,
          institutionId,
          action: 'CREATE',
          tableName: 'sacramental_records',
          recordId: created.id,
          changes: {
            after: {
              id: created.id,
              type: created.type,
              christianName: created.christianName,
              celebrantPriestId: created.celebrantPriestId,
              eventDateUtc: created.eventDateUtc.toISOString(),
              isCanonicalVerified: created.isCanonicalVerified,
            },
          },
        },
        tx,
      );

      return created;
    });

    return record;
  }

  async list(user: AuthenticatedUser, query: ListSacramentsQuery) {
    let targetInstitutionId = user.institutionId;

    if (query.institution_id) {
      if (!isAdministrativeRole(user.ecclesiasticalRole)) {
        throw new ForbiddenError();
      }

      await assertInstitutionAccess(user, query.institution_id, false);
      targetInstitutionId = query.institution_id;
    }

    return sacramentalRecordRepository.findMany({
      institutionId: targetInstitutionId,
      type: query.type,
      page: query.page,
      limit: query.limit,
    });
  }
}

export const sacramentalRecordService = new SacramentalRecordService();
