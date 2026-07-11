import prisma from '../../lib/prisma';
import { auditLogRepository } from '../../repositories/audit-log.repository';
import { AuthenticatedUser } from '../../types';
import { CreateArtifactInput, CreateArtifactInspectionInput } from '../../validators/artifacts-estates.validator';
import { NotFoundError } from '../../middleware/error-handler.middleware';

export class ArtifactService {
  /**
   * Registers a new historical artifact profile under the user's institution (or overridden institution for admins).
   * Automatically writes a core platform AuditLog entry.
   */
  async registerArtifact(user: AuthenticatedUser, input: CreateArtifactInput) {
    const institutionId = input.institutionId ?? user.institutionId;

    return prisma.$transaction(async (tx) => {
      const created = await tx.artifact.create({
        data: {
          institutionId,
          nameEn: input.nameEn,
          nameAm: input.nameAm ?? null,
          nameGez: input.nameGez ?? null,
          category: input.category,
          structuralCondition: input.structuralCondition,
          estimatedAge: input.estimatedAge ?? null,
          storageLocation: input.storageLocation,
          isActive: true,
        },
      });

      await auditLogRepository.create(
        {
          actorId: user.id,
          institutionId,
          action: 'CREATE',
          tableName: 'artifacts',
          recordId: created.id,
          changes: {
            after: {
              id: created.id,
              nameEn: created.nameEn,
              category: created.category,
              structuralCondition: created.structuralCondition,
              storageLocation: created.storageLocation,
            },
          },
        },
        tx,
      );

      return created;
    });
  }

  /**
   * Fetches all registered artifact profiles scoped to an institution.
   */
  async listArtifacts(institutionId: string) {
    return prisma.artifact.findMany({
      where: {
        institutionId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        inspectionLogs: {
          orderBy: {
            inspectedAt: 'desc',
          },
          take: 5,
        },
      },
    });
  }

  /**
   * Logs a new physical condition inspection for an artifact, updates the artifact's condition,
   * and creates a core platform AuditLog entry.
   */
  async logInspection(user: AuthenticatedUser, artifactId: string, input: CreateArtifactInspectionInput) {
    const artifact = await prisma.artifact.findFirst({
      where: {
        id: artifactId,
        isActive: true,
      },
    });

    if (!artifact) {
      throw new NotFoundError('ቅርስ አልተገኘም ወይም ጠፍቷል።');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create inspection log snapshot
      const inspectionLog = await tx.artifactAuditLog.create({
        data: {
          artifactId,
          inspectedByUserId: user.id,
          conditionAtInspection: input.conditionAtInspection,
          inspectionNotes: input.inspectionNotes ?? null,
          inspectedAt: new Date(input.inspectedAt),
        },
      });

      // 2. Update parent artifact condition
      const updatedArtifact = await tx.artifact.update({
        where: { id: artifactId },
        data: {
          structuralCondition: input.conditionAtInspection,
        },
      });

      // 3. Write core platform AuditLog
      await auditLogRepository.create(
        {
          actorId: user.id,
          institutionId: artifact.institutionId,
          action: 'UPDATE_CONDITION',
          tableName: 'artifacts',
          recordId: artifactId,
          changes: {
            before: {
              structuralCondition: artifact.structuralCondition,
            },
            after: {
              structuralCondition: updatedArtifact.structuralCondition,
              inspectionLogId: inspectionLog.id,
            },
          },
        },
        tx,
      );

      return {
        inspectionLog,
        artifact: updatedArtifact,
      };
    });
  }
}

export const artifactService = new ArtifactService();
