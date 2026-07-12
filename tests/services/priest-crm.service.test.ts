import bcrypt from 'bcrypt';
import { EcclesiasticalRole, AuthRole, InstitutionType } from '@prisma/client';
import { priestCrmService } from '../../src/services/priest-crm.service';
import { userRepository } from '../../src/repositories/user.repository';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { parishLedgerRepository } from '../../src/repositories/parish-ledger.repository';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../src/middleware/error-handler.middleware';

// ── Mock all three repositories ───────────────────────────────────────────────
jest.mock('../../src/repositories/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    updateById: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
    findPriestsByInstitution: jest.fn(),
  },
}));

jest.mock('../../src/repositories/parish-ledger.repository', () => ({
  parishLedgerRepository: {
    findLatestAsratByUserId: jest.fn(),
    findFollowersByPriestId: jest.fn(),
  },
}));

// ── Type-safe mock references ─────────────────────────────────────────────────
const userRepo = jest.mocked(userRepository);
const instRepo = jest.mocked(institutionRepository);
const ledgerRepo = jest.mocked(parishLedgerRepository);

// ── Shared test fixtures ──────────────────────────────────────────────────────
const makeInstitution = (overrides = {}) => ({
  id: 'inst-1',
  hierarchyPath: '/Ethiopia/Addis/Parish1',
  type: InstitutionType.PARISH,
  deletedAt: null,
  nameEn: 'St. Mary Church',
  nameAm: 'ቅ/ማርያም',
  nameGez: null,
  name: 'St. Mary Church',
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makePriest = (overrides = {}) => ({
  id: 'priest-1',
  email: 'priest@church.et',
  passwordHash: 'hashed',
  fullName: 'Abba Qozman',
  titleEn: 'Rev.',
  titleAm: 'አባ',
  titleGez: null,
  nameEn: 'Qozman',
  nameAm: 'ቆዝማን',
  nameGez: null,
  ecclesiasticalRole: EcclesiasticalRole.PRIEST,
  authRole: AuthRole.PRIEST,
  institutionId: 'inst-1',
  age: null,
  spiritualFatherId: null,
  sex: 'MALE',
  location: 'Addis Ababa',
  deletedAt: null,
  institution: makeInstitution(),
  ...overrides,
});

const makeFollower = (overrides = {}) => ({
  id: 'follower-1',
  email: 'follower@church.et',
  passwordHash: 'hashed',
  fullName: 'Kassa Belay',
  titleEn: null,
  titleAm: null,
  titleGez: null,
  nameEn: 'Kassa',
  nameAm: 'ካሳ',
  nameGez: null,
  ecclesiasticalRole: EcclesiasticalRole.LAITY,
  authRole: AuthRole.MIMEN,
  institutionId: 'inst-1',
  age: null,
  spiritualFatherId: 'priest-1',
  sex: 'MALE',
  location: 'Addis Ababa',
  deletedAt: null,
  institution: makeInstitution(),
  ...overrides,
});

describe('PriestCrmService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createFollower ───────────────────────────────────────────────────────────
  describe('createFollower', () => {
    it('throws UnauthorizedError when caller is not a PRIEST', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(
        makePriest({ ecclesiasticalRole: EcclesiasticalRole.LAITY }),
      );

      await expect(
        priestCrmService.createFollower('priest-1', {
          email: 'new@church.et',
          password: 'pass1234',
          fullName: 'New Follower',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when priest record is soft-deleted', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(
        makePriest({ deletedAt: new Date() }),
      );

      await expect(
        priestCrmService.createFollower('priest-1', {
          email: 'new@church.et',
          password: 'pass1234',
          fullName: 'New Follower',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws ConflictError when email is already registered', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(makePriest());
      (userRepo.findByEmail as jest.Mock).mockResolvedValueOnce(makeFollower());

      await expect(
        priestCrmService.createFollower('priest-1', {
          email: 'follower@church.et',
          password: 'pass1234',
          fullName: 'Kassa Belay',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates and returns a FollowerProfile on success', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(makePriest());
      (userRepo.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      (userRepo.createUser as jest.Mock).mockResolvedValueOnce(makeFollower());
      // buildFollowerProfile calls findLatestAsratByUserId
      (ledgerRepo.findLatestAsratByUserId as jest.Mock).mockResolvedValueOnce(null);

      const result = await priestCrmService.createFollower('priest-1', {
        email: 'follower@church.et',
        password: 'pass1234',
        fullName: 'Kassa Belay',
        sex: 'MALE',
      });

      expect(userRepo.createUser).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('follower-1');
      expect(result.paymentStatus).toBe('DELAYED'); // never paid → DELAYED
    });
  });

  // ── updateFollower ───────────────────────────────────────────────────────────
  describe('updateFollower', () => {
    it('throws NotFoundError when follower does not exist', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        priestCrmService.updateFollower('priest-1', 'follower-1', { fullName: 'Updated' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when follower belongs to a different priest', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(
        makeFollower({ spiritualFatherId: 'other-priest' }),
      );

      await expect(
        priestCrmService.updateFollower('priest-1', 'follower-1', { fullName: 'Updated' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ConflictError when new email is already taken', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(makeFollower());
      // findByEmail returns a DIFFERENT user — simulates duplicate
      (userRepo.findByEmail as jest.Mock).mockResolvedValueOnce(
        makeFollower({ id: 'other-user', email: 'taken@church.et' }),
      );

      await expect(
        priestCrmService.updateFollower('priest-1', 'follower-1', { email: 'taken@church.et' }),
      ).rejects.toThrow(ConflictError);
    });

    it('updates and returns a FollowerProfile on success', async () => {
      const updated = makeFollower({ fullName: 'Updated Name' });
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(makeFollower());
      (userRepo.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      (userRepo.updateById as jest.Mock).mockResolvedValueOnce(updated);
      (ledgerRepo.findLatestAsratByUserId as jest.Mock).mockResolvedValueOnce(null);

      const result = await priestCrmService.updateFollower('priest-1', 'follower-1', {
        fullName: 'Updated Name',
      });

      expect(userRepo.updateById).toHaveBeenCalledTimes(1);
      expect(result.fullName).toBe('Updated Name');
    });
  });

  // ── deleteFollower ───────────────────────────────────────────────────────────
  describe('deleteFollower', () => {
    it('throws NotFoundError when follower does not exist', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        priestCrmService.deleteFollower('priest-1', 'follower-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when follower belongs to a different priest', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(
        makeFollower({ spiritualFatherId: 'another-priest' }),
      );

      await expect(
        priestCrmService.deleteFollower('priest-1', 'follower-1'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('calls softDelete and resolves void on success', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValueOnce(makeFollower());
      (userRepo.softDelete as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(
        priestCrmService.deleteFollower('priest-1', 'follower-1'),
      ).resolves.toBeUndefined();

      expect(userRepo.softDelete).toHaveBeenCalledWith('follower-1');
    });
  });

  // ── getMyFollowers ───────────────────────────────────────────────────────────
  describe('getMyFollowers', () => {
    const baseUser = {
      id: 'f-1',
      fullName: 'Kassa',
      email: 'kassa@church.et',
      nameAm: null,
      nameGez: null,
      sex: 'MALE',
      location: 'Addis',
      institutionId: 'inst-1',
      ecclesiasticalRole: 'LAITY',
    };

    it('marks followers with no ASRAT entries as DELAYED', async () => {
      (ledgerRepo.findFollowersByPriestId as jest.Mock).mockResolvedValueOnce([
        { ...baseUser, parishLedgerEntries: [] },
      ]);

      const result = await priestCrmService.getMyFollowers('priest-1');

      expect(result[0].paymentStatus).toBe('DELAYED');
      expect(result[0].lastAsratDate).toBeNull();
    });

    it('marks followers with ASRAT > 30 days ago as DELAYED', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 60);

      (ledgerRepo.findFollowersByPriestId as jest.Mock).mockResolvedValueOnce([
        { ...baseUser, parishLedgerEntries: [{ createdAt: old }] },
      ]);

      const result = await priestCrmService.getMyFollowers('priest-1');

      expect(result[0].paymentStatus).toBe('DELAYED');
    });

    it('does NOT mark followers who paid within 30 days', async () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 10);

      (ledgerRepo.findFollowersByPriestId as jest.Mock).mockResolvedValueOnce([
        { ...baseUser, parishLedgerEntries: [{ createdAt: recent }] },
      ]);

      const result = await priestCrmService.getMyFollowers('priest-1');

      expect(result[0].paymentStatus).toBeUndefined();
    });
  });

  // ── listPriestsByInstitution ─────────────────────────────────────────────────
  describe('listPriestsByInstitution', () => {
    it('throws NotFoundError when institution does not exist', async () => {
      (instRepo.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        priestCrmService.listPriestsByInstitution('inst-missing'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when institution is soft-deleted', async () => {
      (instRepo.findById as jest.Mock).mockResolvedValueOnce(
        makeInstitution({ deletedAt: new Date() }),
      );

      await expect(
        priestCrmService.listPriestsByInstitution('inst-1'),
      ).rejects.toThrow(NotFoundError);
    });

    it('returns priests list from repository on success', async () => {
      const mockPriests = [
        { id: 'p-1', fullName: 'Abba Alpha', email: 'a@c.et', titleEn: null, titleAm: null, titleGez: null, sex: 'MALE', location: 'Addis' },
      ];
      (instRepo.findById as jest.Mock).mockResolvedValueOnce(makeInstitution());
      (instRepo.findPriestsByInstitution as jest.Mock).mockResolvedValueOnce(mockPriests);

      const result = await priestCrmService.listPriestsByInstitution('inst-1');

      expect(instRepo.findPriestsByInstitution).toHaveBeenCalledWith('inst-1');
      expect(result).toEqual(mockPriests);
    });
  });
});
