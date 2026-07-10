import { EcclesiasticalRole, SacramentalType, FastingTier } from '@prisma/client';
import { SacramentalRecordService } from '../../src/services/sacramental-record.service';
import { sacramentalRecordRepository } from '../../src/repositories/sacramental-record.repository';
import { auditLogRepository } from '../../src/repositories/audit-log.repository';
import { institutionRepository } from '../../src/repositories/institution.repository';
import prisma from '../../src/lib/prisma';
import { AuthenticatedUser } from '../../src/types';
import { CreateSacramentInput } from '../../src/validators/sacrament.validator';
import { calendarService } from '../../src/services/calendar.service';
import { clergyLedgerService } from '../../src/services/clergy/clergy-ledger.service';

jest.mock('../../src/services/calendar.service', () => ({
  calendarService: {
    getDailyLiturgicalContext: jest.fn(),
  },
}));

jest.mock('../../src/services/clergy/clergy-ledger.service', () => ({
  clergyLedgerService: {
    verifyClergySacramentalAuthority: jest.fn(),
  },
}));

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    user: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../src/repositories/sacramental-record.repository', () => ({
  sacramentalRecordRepository: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}));

jest.mock('../../src/repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: jest.fn(),
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockUserFindFirst = prisma.user.findFirst as jest.Mock;
const mockSacramentCreate = sacramentalRecordRepository.create as jest.Mock;
const mockAuditCreate = auditLogRepository.create as jest.Mock;
const mockInstitutionFindById = institutionRepository.findById as jest.Mock;
const mockGetDailyLiturgicalContext = calendarService.getDailyLiturgicalContext as jest.Mock;
const mockVerifyClergySacramentalAuthority = clergyLedgerService.verifyClergySacramentalAuthority as jest.Mock;

describe('SacramentalRecordService', () => {
  let service: SacramentalRecordService;

  const priestUser: AuthenticatedUser = {
    id: 'priest-user-1',
    institutionId: 'inst-parish-12',
    hierarchyPath: '/1/3/12/',
    ecclesiasticalRole: EcclesiasticalRole.PRIEST,
  };

  const validInput: CreateSacramentInput = {
    type: SacramentalType.BAPTISM,
    christianName: 'John the Baptist',
    celebrantPriestId: 'priest-user-1',
    sponsorName: 'Maria Sponsor',
    eventDateUtc: '2026-07-09T10:00:00.000Z',
    calendarMetadata: {
      gregorian: '2026-07-09',
      julian: '2026-06-26',
      ethiopic: '2018-10-01',
      feastOrFast: 'Ordinary Time',
    },
    isCanonicalVerified: false,
  };

  const createdRecord = {
    id: 'record-1',
    institutionId: 'inst-parish-12',
    type: SacramentalType.BAPTISM,
    targetUserId: null,
    christianName: 'John the Baptist',
    celebrantPriestId: 'priest-user-1',
    sponsorName: 'Maria Sponsor',
    eventDateUtc: new Date('2026-07-09T10:00:00.000Z'),
    calendarMetadata: validInput.calendarMetadata,
    isCanonicalVerified: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyClergySacramentalAuthority.mockResolvedValue(true);
    service = new SacramentalRecordService();
  });

  describe('create', () => {
    it('creates a sacramental record and immutable audit log in a single transaction', async () => {
      mockInstitutionFindById.mockResolvedValue({
        id: 'inst-parish-12',
        hierarchyPath: '/1/3/12/',
        deletedAt: null,
      });

      mockUserFindFirst.mockResolvedValue({
        id: 'priest-user-1',
        institutionId: 'inst-parish-12',
      });

      mockTransaction.mockImplementation(async (callback) => {
        const tx = {};
        mockSacramentCreate.mockResolvedValue(createdRecord);
        mockAuditCreate.mockResolvedValue({
          id: 'audit-1',
          action: 'CREATE',
          tableName: 'sacramental_records',
          recordId: 'record-1',
        });
        return callback(tx);
      });

      const result = await service.create(priestUser, validInput);

      expect(result).toEqual(createdRecord);
      expect(mockSacramentCreate).toHaveBeenCalledTimes(1);
      expect(mockAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'priest-user-1',
          institutionId: 'inst-parish-12',
          action: 'CREATE',
          tableName: 'sacramental_records',
          recordId: 'record-1',
          changes: expect.objectContaining({
            after: expect.objectContaining({
              type: SacramentalType.BAPTISM,
              christianName: 'John the Baptist',
            }),
          }),
        }),
        expect.anything(),
      );
    });

    it('throws NotFoundError when institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(service.create(priestUser, validInput)).rejects.toMatchObject({
        name: 'NotFoundError',
        statusCode: 404,
      });
    });

    it('throws NotFoundError when celebrant is not in the same institution', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: 'inst-parish-12' });
      mockUserFindFirst.mockResolvedValue(null);

      await expect(service.create(priestUser, validInput)).rejects.toMatchObject({
        name: 'NotFoundError',
        message: 'Celebrant priest not found in this institution.',
      });
    });

    it('throws CanonicalValidationError when registering a marriage during a fasting period', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: 'inst-parish-12' });
      mockUserFindFirst.mockResolvedValue({ id: 'priest-user-1', institutionId: 'inst-parish-12' });
      mockGetDailyLiturgicalContext.mockResolvedValue({
        fasting: {
          tier: FastingTier.STRICT,
          title: "Apostles' Fast",
        },
      });

      const marriageInput: CreateSacramentInput = {
        ...validInput,
        type: SacramentalType.MARRIAGE,
      };

      await expect(service.create(priestUser, marriageInput)).rejects.toMatchObject({
        name: 'CanonicalValidationError',
        statusCode: 422,
        message: 'Marriage is not permitted during fasting periods.',
      });
    });

    it('allows registering a marriage when it is not a fasting period', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: 'inst-parish-12' });
      mockUserFindFirst.mockResolvedValue({ id: 'priest-user-1', institutionId: 'inst-parish-12' });
      mockGetDailyLiturgicalContext.mockResolvedValue({
        fasting: {
          tier: FastingTier.NONE,
          title: 'Ordinary Time',
        },
      });
      mockTransaction.mockImplementation(async (callback) => {
        mockSacramentCreate.mockResolvedValue({
          ...createdRecord,
          type: SacramentalType.MARRIAGE,
        });
        mockAuditCreate.mockResolvedValue({ id: 'audit-1' });
        return callback({});
      });

      const marriageInput: CreateSacramentInput = {
        ...validInput,
        type: SacramentalType.MARRIAGE,
      };

      const result = await service.create(priestUser, marriageInput);
      expect(result.type).toBe(SacramentalType.MARRIAGE);
      expect(mockSacramentCreate).toHaveBeenCalledTimes(1);
    });

    it('allows registering a non-marriage sacrament during a fasting period', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: 'inst-parish-12' });
      mockUserFindFirst.mockResolvedValue({ id: 'priest-user-1', institutionId: 'inst-parish-12' });
      mockGetDailyLiturgicalContext.mockResolvedValue({
        fasting: {
          tier: FastingTier.STRICT,
          title: "Apostles' Fast",
        },
      });
      mockTransaction.mockImplementation(async (callback) => {
        mockSacramentCreate.mockResolvedValue(createdRecord);
        mockAuditCreate.mockResolvedValue({ id: 'audit-1' });
        return callback({});
      });

      const result = await service.create(priestUser, validInput);
      expect(result.type).toBe(SacramentalType.BAPTISM);
      expect(mockSacramentCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('list', () => {
    it('returns only parish records for a parish priest', async () => {
      (sacramentalRecordRepository.findMany as jest.Mock).mockResolvedValue({
        records: [createdRecord],
        total: 1,
      });

      const result = await service.list(priestUser, {
        page: 1,
        limit: 20,
      });

      expect(sacramentalRecordRepository.findMany).toHaveBeenCalledWith({
        institutionId: 'inst-parish-12',
        type: undefined,
        page: 1,
        limit: 20,
      });
      expect(result.total).toBe(1);
    });

    it('rejects institution_id drill-down for non-administrative roles', async () => {
      await expect(
        service.list(priestUser, {
          institution_id: 'inst-parish-99',
          page: 1,
          limit: 20,
        }),
      ).rejects.toMatchObject({
        name: 'ForbiddenError',
        statusCode: 403,
      });
    });
  });
});
