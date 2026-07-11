import { EcclesiasticalRole, ArtifactCategory, StructuralCondition } from '@prisma/client';
import { artifactService } from '../../src/services/logistics/artifact.service';
import { estateService } from '../../src/services/logistics/estate.service';
import { auditLogRepository } from '../../src/repositories/audit-log.repository';
import prisma from '../../src/lib/prisma';
import { AuthenticatedUser } from '../../src/types';
import { NotFoundError } from '../../src/middleware/error-handler.middleware';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    artifact: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    monasticEstate: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    artifactAuditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../src/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: jest.fn(),
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockArtifactCreate = prisma.artifact.create as jest.Mock;
const mockArtifactFindFirst = prisma.artifact.findFirst as jest.Mock;
const mockArtifactFindMany = prisma.artifact.findMany as jest.Mock;
const mockArtifactUpdate = prisma.artifact.update as jest.Mock;
const mockMonasticEstateCreate = prisma.monasticEstate.create as jest.Mock;
const mockMonasticEstateFindMany = prisma.monasticEstate.findMany as jest.Mock;
const mockArtifactAuditLogCreate = prisma.artifactAuditLog.create as jest.Mock;
const mockAuditLogCreate = auditLogRepository.create as jest.Mock;

describe('Artifact & Estate Services', () => {
  const priestUser: AuthenticatedUser = {
    id: 'user-priest-1',
    institutionId: 'inst-parish-1',
    hierarchyPath: '/inst-patriarchate/inst-parish-1/',
    ecclesiasticalRole: EcclesiasticalRole.PRIEST,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) => callback(prisma));
  });

  describe('ArtifactService', () => {
    describe('registerArtifact', () => {
      it('creates an artifact and writes audit log successfully', async () => {
        const input = {
          nameEn: 'Gospel Manuscript',
          nameAm: 'የወንጌል ቅርስ',
          nameGez: 'ወንጌል ቅርስ',
          category: ArtifactCategory.MANUSCRIPT,
          structuralCondition: StructuralCondition.EXCELLENT,
          estimatedAge: 400,
          storageLocation: 'Northern Vault',
        };

        const createdArtifact = {
          id: 'artifact-123',
          institutionId: priestUser.institutionId,
          ...input,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockArtifactCreate.mockResolvedValue(createdArtifact);

        const result = await artifactService.registerArtifact(priestUser, input);

        expect(result).toEqual(createdArtifact);
        expect(mockArtifactCreate).toHaveBeenCalledWith({
          data: {
            institutionId: priestUser.institutionId,
            nameEn: input.nameEn,
            nameAm: input.nameAm,
            nameGez: input.nameGez,
            category: input.category,
            structuralCondition: input.structuralCondition,
            estimatedAge: input.estimatedAge,
            storageLocation: input.storageLocation,
            isActive: true,
          },
        });
        expect(mockAuditLogCreate).toHaveBeenCalledWith(
          {
            actorId: priestUser.id,
            institutionId: priestUser.institutionId,
            action: 'CREATE',
            tableName: 'artifacts',
            recordId: createdArtifact.id,
            changes: {
              after: {
                id: createdArtifact.id,
                nameEn: createdArtifact.nameEn,
                category: createdArtifact.category,
                structuralCondition: createdArtifact.structuralCondition,
                storageLocation: createdArtifact.storageLocation,
              },
            },
          },
          prisma,
        );
      });
    });

    describe('listArtifacts', () => {
      it('returns artifacts scoped to the institution', async () => {
        const artifacts = [
          { id: '1', nameEn: 'A' },
          { id: '2', nameEn: 'B' },
        ];
        mockArtifactFindMany.mockResolvedValue(artifacts);

        const result = await artifactService.listArtifacts('inst-1');

        expect(result).toEqual(artifacts);
        expect(mockArtifactFindMany).toHaveBeenCalledWith({
          where: {
            institutionId: 'inst-1',
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
      });
    });

    describe('logInspection', () => {
      it('throws NotFoundError if artifact is missing', async () => {
        mockArtifactFindFirst.mockResolvedValue(null);

        const input = {
          conditionAtInspection: StructuralCondition.GOOD,
          inspectionNotes: 'All looks fine.',
          inspectedAt: new Date().toISOString(),
        };

        await expect(
          artifactService.logInspection(priestUser, 'invalid-id', input),
        ).rejects.toThrow(NotFoundError);
      });

      it('logs inspection, updates condition, and records audit log', async () => {
        const artifact = {
          id: 'art-1',
          institutionId: 'inst-1',
          structuralCondition: StructuralCondition.EXCELLENT,
        };

        const input = {
          conditionAtInspection: StructuralCondition.NEEDS_RESTORATION,
          inspectionNotes: 'Needs some glue.',
          inspectedAt: new Date().toISOString(),
        };

        const loggedInspection = {
          id: 'log-1',
          artifactId: 'art-1',
          inspectedByUserId: priestUser.id,
          conditionAtInspection: input.conditionAtInspection,
          inspectionNotes: input.inspectionNotes,
          inspectedAt: new Date(input.inspectedAt),
        };

        const updatedArtifact = {
          ...artifact,
          structuralCondition: input.conditionAtInspection,
        };

        mockArtifactFindFirst.mockResolvedValue(artifact);
        mockArtifactAuditLogCreate.mockResolvedValue(loggedInspection);
        mockArtifactUpdate.mockResolvedValue(updatedArtifact);

        const result = await artifactService.logInspection(priestUser, 'art-1', input);

        expect(result).toEqual({
          inspectionLog: loggedInspection,
          artifact: updatedArtifact,
        });

        expect(mockArtifactAuditLogCreate).toHaveBeenCalledWith({
          data: {
            artifactId: 'art-1',
            inspectedByUserId: priestUser.id,
            conditionAtInspection: input.conditionAtInspection,
            inspectionNotes: input.inspectionNotes,
            inspectedAt: new Date(input.inspectedAt),
          },
        });

        expect(mockArtifactUpdate).toHaveBeenCalledWith({
          where: { id: 'art-1' },
          data: { structuralCondition: input.conditionAtInspection },
        });

        expect(mockAuditLogCreate).toHaveBeenCalledWith(
          {
            actorId: priestUser.id,
            institutionId: artifact.institutionId,
            action: 'UPDATE_CONDITION',
            tableName: 'artifacts',
            recordId: 'art-1',
            changes: {
              before: {
                structuralCondition: artifact.structuralCondition,
              },
              after: {
                structuralCondition: updatedArtifact.structuralCondition,
                inspectionLogId: loggedInspection.id,
              },
            },
          },
          prisma,
        );
      });
    });
  });

  describe('EstateService', () => {
    describe('registerEstate', () => {
      it('registers a monastic estate and records audit log', async () => {
        const input = {
          estateName: 'Debre Damo Estate',
          landAreaHectares: 120.5,
          gpsLatitude: 14.37,
          gpsLongitude: 39.28,
          legalDeedStatus: 'Certified',
          currentUtilization: 'Agriculture and Monastic dwelling',
        };

        const createdEstate = {
          id: 'estate-1',
          institutionId: priestUser.institutionId,
          estateName: input.estateName,
          landAreaHectares: { toString: () => '120.5' },
          gpsLatitude: { toString: () => '14.37' },
          gpsLongitude: { toString: () => '39.28' },
          legalDeedStatus: input.legalDeedStatus,
          currentUtilization: input.currentUtilization,
          isActive: true,
        };

        mockMonasticEstateCreate.mockResolvedValue(createdEstate);

        const result = await estateService.registerEstate(priestUser, input);

        expect(result).toEqual(createdEstate);
        expect(mockMonasticEstateCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            institutionId: priestUser.institutionId,
            estateName: input.estateName,
            legalDeedStatus: input.legalDeedStatus,
            currentUtilization: input.currentUtilization,
            isActive: true,
          }),
        });

        expect(mockAuditLogCreate).toHaveBeenCalledWith(
          {
            actorId: priestUser.id,
            institutionId: priestUser.institutionId,
            action: 'CREATE',
            tableName: 'monastic_estates',
            recordId: createdEstate.id,
            changes: {
              after: {
                id: createdEstate.id,
                estateName: createdEstate.estateName,
                landAreaHectares: '120.5',
                gpsLatitude: '14.37',
                gpsLongitude: '39.28',
                legalDeedStatus: createdEstate.legalDeedStatus,
              },
            },
          },
          prisma,
        );
      });
    });

    describe('listEstates', () => {
      it('lists monastic estates scoped to institution', async () => {
        const estates = [{ id: 'est-1' }, { id: 'est-2' }];
        mockMonasticEstateFindMany.mockResolvedValue(estates);

        const result = await estateService.listEstates('inst-abc');

        expect(result).toEqual(estates);
        expect(mockMonasticEstateFindMany).toHaveBeenCalledWith({
          where: {
            institutionId: 'inst-abc',
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      });
    });
  });
});
