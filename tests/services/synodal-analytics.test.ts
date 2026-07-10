import { EcclesiasticalRole, InstitutionType } from '@prisma/client';
import { synodalAnalyticsService } from '../../src/services/synodal/synodal-analytics.service';
import prisma from '../../src/lib/prisma';
import {
  ForbiddenError,
  NotFoundError,
} from '../../src/middleware/error-handler.middleware';

// ─── Mock Prisma Client ────────────────────────────────────────────────────────

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    user: { findFirst: jest.fn(), update: jest.fn() },
    institution: { findFirst: jest.fn(), findMany: jest.fn() },
    clergyAssignmentHistory: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    clergyProfile: { findFirst: jest.fn(), update: jest.fn() },
  },
}));

// ─── Typed Mock Helpers ────────────────────────────────────────────────────────

const mockUserFindFirst = prisma.user.findFirst as jest.Mock;
const mockUserUpdate = prisma.user.update as jest.Mock;
const mockInstFindFirst = prisma.institution.findFirst as jest.Mock;
const mockInstFindMany = prisma.institution.findMany as jest.Mock;
const mockHistoryFindFirst = prisma.clergyAssignmentHistory.findFirst as jest.Mock;
const mockHistoryUpdate = prisma.clergyAssignmentHistory.update as jest.Mock;
const mockHistoryCreate = prisma.clergyAssignmentHistory.create as jest.Mock;
const mockProfileFindFirst = prisma.clergyProfile.findFirst as jest.Mock;
const mockProfileUpdate = prisma.clergyProfile.update as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

describe('SynodalAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getDiocesanAggregateMetrics ─────────────────────────────────────────────

  describe('getDiocesanAggregateMetrics', () => {
    const executiveUserId = 'exec-user-1';
    const dioceseId = 'diocese-1';

    it('throws ForbiddenError when user has a role other than BISHOP or DIOCESAN_ADMIN (e.g. PRIEST/PARISH_ADMIN)', async () => {
      // Simulate executive user who is a parish priest (not a BISHOP or DIOCESAN_ADMIN)
      mockUserFindFirst.mockResolvedValue({
        id: executiveUserId,
        ecclesiasticalRole: EcclesiasticalRole.PRIEST,
        institution: { hierarchyPath: '/1/2/3/' },
      });

      await expect(
        synodalAnalyticsService.getDiocesanAggregateMetrics(executiveUserId, dioceseId)
      ).rejects.toThrow(
        new ForbiddenError('AccessDenied: Executive role check failed.')
      );

      expect(mockInstFindFirst).not.toHaveBeenCalled();
    });

    it('throws ForbiddenError when user is a BISHOP but from a different diocese hierarchy (boundary mismatch)', async () => {
      // Bishop is at diocese 2 (hierarchy /1/3/)
      mockUserFindFirst.mockResolvedValue({
        id: executiveUserId,
        ecclesiasticalRole: EcclesiasticalRole.BISHOP,
        hierarchyPath: '/1/3/',
        institution: { hierarchyPath: '/1/3/' },
      });

      // Target diocese is diocese 1 (hierarchy /1/2/)
      mockInstFindFirst.mockResolvedValue({
        id: dioceseId,
        hierarchyPath: '/1/2/',
      });

      await expect(
        synodalAnalyticsService.getDiocesanAggregateMetrics(executiveUserId, dioceseId)
      ).rejects.toThrow(
        new ForbiddenError('AccessDenied: Hierarchy boundary mismatch.')
      );
    });

    it('returns aggregate sums recursively over downstream child nodes for authorized bishops', async () => {
      // Authorized bishop at diocese 1 (hierarchy /1/2/)
      mockUserFindFirst.mockResolvedValue({
        id: executiveUserId,
        ecclesiasticalRole: EcclesiasticalRole.BISHOP,
        hierarchyPath: '/1/2/',
        institution: { hierarchyPath: '/1/2/' },
      });

      mockInstFindFirst.mockResolvedValue({
        id: dioceseId,
        name: 'Addis Ababa Diocese',
        hierarchyPath: '/1/2/',
      });

      // Mock institutions in the subtree:
      // Inst 1: diocese node itself (1 laity, 1 priest)
      // Inst 2: downstream parish (2 laity, 1 priest, 1 deacon)
      mockInstFindMany.mockResolvedValue([
        {
          id: dioceseId,
          name: 'Addis Ababa Diocese',
          users: [
            { ecclesiasticalRole: EcclesiasticalRole.LAITY },
            { ecclesiasticalRole: EcclesiasticalRole.PRIEST },
          ],
        },
        {
          id: 'parish-1',
          name: 'Saint George Parish',
          users: [
            { ecclesiasticalRole: EcclesiasticalRole.LAITY },
            { ecclesiasticalRole: EcclesiasticalRole.LAITY },
            { ecclesiasticalRole: EcclesiasticalRole.PRIEST },
            { ecclesiasticalRole: EcclesiasticalRole.DEACON },
          ],
        },
      ]);

      const result = await synodalAnalyticsService.getDiocesanAggregateMetrics(
        executiveUserId,
        dioceseId
      );

      expect(result).toEqual({
        dioceseId,
        dioceseName: 'Addis Ababa Diocese',
        totalParishioners: 3, // 1 + 2
        activeClergy: 3,       // 1 PRIEST + (1 PRIEST + 1 DEACON)
      });

      expect(mockInstFindMany).toHaveBeenCalledWith({
        where: {
          hierarchyPath: { startsWith: '/1/2/' },
          deletedAt: null,
        },
        include: {
          users: {
            where: { deletedAt: null },
            select: { ecclesiasticalRole: true },
          },
        },
      });
    });
  });

  // ─── executeClergyTransfer ───────────────────────────────────────────────────

  describe('executeClergyTransfer', () => {
    const authorizerId = 'patriarch-1';
    const clergyId = 'priest-1';
    const toInstitutionId = 'parish-2';

    it('mutates active status and location pointers inside a transaction successfully', async () => {
      const mockActiveHistory = {
        id: 'active-history-uuid',
        clergyUserId: clergyId,
        toInstitutionId: 'parish-1',
        startDate: new Date('2025-01-01'),
        endDate: null,
      };

      const mockNewHistory = {
        id: 'new-history-uuid',
        clergyUserId: clergyId,
        fromInstitutionId: 'parish-1',
        toInstitutionId,
        startDate: new Date(),
        endDate: null,
        authorizedByUserId: authorizerId,
      };

      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            findFirst: jest.fn().mockResolvedValue({ id: clergyId }),
            update: jest.fn(),
          },
          institution: {
            findFirst: jest.fn().mockResolvedValue({ id: toInstitutionId }),
          },
          clergyAssignmentHistory: {
            findFirst: jest.fn().mockResolvedValue(mockActiveHistory),
            update: jest.fn(),
            create: jest.fn().mockResolvedValue(mockNewHistory),
          },
          clergyProfile: {
            findFirst: jest.fn().mockResolvedValue({ id: 'profile-uuid-1' }),
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await synodalAnalyticsService.executeClergyTransfer(
        authorizerId,
        {
          clergyId,
          toInstitutionId,
        }
      );

      expect(result).toEqual(mockNewHistory);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundError if target clergy user does not exist', async () => {
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(
        synodalAnalyticsService.executeClergyTransfer(authorizerId, {
          clergyId,
          toInstitutionId,
        })
      ).rejects.toThrow(new NotFoundError('Clergy user not found.'));
    });
  });
});
