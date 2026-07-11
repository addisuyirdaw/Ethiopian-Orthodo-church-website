import prisma from '../../lib/prisma';
import { auditLogRepository } from '../../repositories/audit-log.repository';
import { AuthenticatedUser } from '../../types';
import { CreateMonasticEstateInput } from '../../validators/artifacts-estates.validator';
import { Prisma } from '@prisma/client';

export class EstateService {
  /**
   * Registers a new GPS-bounded monastic land chart under the user's institution (or overridden institution for admins).
   * Automatically writes a core platform AuditLog entry.
   */
  async registerEstate(user: AuthenticatedUser, input: CreateMonasticEstateInput) {
    const institutionId = input.institutionId ?? user.institutionId;

    return prisma.$transaction(async (tx) => {
      const created = await tx.monasticEstate.create({
        data: {
          institutionId,
          estateName: input.estateName,
          landAreaHectares: new Prisma.Decimal(input.landAreaHectares),
          gpsLatitude: new Prisma.Decimal(input.gpsLatitude),
          gpsLongitude: new Prisma.Decimal(input.gpsLongitude),
          legalDeedStatus: input.legalDeedStatus,
          currentUtilization: input.currentUtilization,
          isActive: true,
        },
      });

      await auditLogRepository.create(
        {
          actorId: user.id,
          institutionId,
          action: 'CREATE',
          tableName: 'monastic_estates',
          recordId: created.id,
          changes: {
            after: {
              id: created.id,
              estateName: created.estateName,
              landAreaHectares: created.landAreaHectares.toString(),
              gpsLatitude: created.gpsLatitude.toString(),
              gpsLongitude: created.gpsLongitude.toString(),
              legalDeedStatus: created.legalDeedStatus,
            },
          },
        },
        tx,
      );

      return created;
    });
  }

  /**
   * Fetches all registered monastic estates scoped to an institution.
   */
  async listEstates(institutionId: string) {
    return prisma.monasticEstate.findMany({
      where: {
        institutionId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const estateService = new EstateService();
