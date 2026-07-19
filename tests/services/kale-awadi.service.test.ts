import { CouncilRole } from '@prisma/client';
import { kaleAwadiService } from '../../src/services/kale-awadi.service';
import { sebekaGubaeSeatRepository } from '../../src/repositories/sebeka-gubae-seat.repository';
import { qaleGubaeRepository } from '../../src/repositories/qale-gubae.repository';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { userRepository } from '../../src/repositories/user.repository';
import { assertInstitutionAccess } from '../../src/middleware/tenant-rbac.middleware';

jest.mock('../../src/repositories/sebeka-gubae-seat.repository', () => ({
  sebekaGubaeSeatRepository: {
    create: jest.fn(),
    deactivate: jest.fn(),
    findActiveRoleInInstitution: jest.fn(),
    findActiveSeatsByInstitution: jest.fn(),
    findActiveSeatByUser: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/qale-gubae.repository', () => ({
  qaleGubaeRepository: {
    create: jest.fn(),
    findManyForInstitution: jest.fn(),
  },
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../src/middleware/tenant-rbac.middleware', () => ({
  assertInstitutionAccess: jest.fn(),
}));

const mockSeatCreate = sebekaGubaeSeatRepository.create as jest.Mock;
const mockSeatDeactivate = sebekaGubaeSeatRepository.deactivate as jest.Mock;
const mockSeatFindActiveRole = sebekaGubaeSeatRepository.findActiveRoleInInstitution as jest.Mock;
const mockSeatFindActiveSeats = sebekaGubaeSeatRepository.findActiveSeatsByInstitution as jest.Mock;
const mockSeatFindById = sebekaGubaeSeatRepository.findById as jest.Mock;

const mockQaleGubaeCreate = qaleGubaeRepository.create as jest.Mock;
const mockQaleGubaeFindMany = qaleGubaeRepository.findManyForInstitution as jest.Mock;

const mockInstitutionFindById = institutionRepository.findById as jest.Mock;
const mockUserFindById = userRepository.findById as jest.Mock;
const mockAssertAccess = assertInstitutionAccess as jest.Mock;

describe('Kale Awadi Governance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assignSeat', () => {
    const institutionId = 'inst-123';
    const input = {
      userId: 'user-123',
      role: CouncilRole.LIQE_MENBER,
      termStart: new Date('2026-01-01'),
      termEnd: new Date('2027-01-01'),
      isActive: true,
    };

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.assignSeat(institutionId, input)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockUserFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.assignSeat(institutionId, input)).rejects.toThrow(
        `User with ID ${input.userId} not found.`
      );
    });

    it('should throw ConflictError if role is already assigned in parish', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockUserFindById.mockResolvedValue({ id: input.userId });
      mockSeatFindActiveRole.mockResolvedValue({ id: 'existing-seat' });

      await expect(kaleAwadiService.assignSeat(institutionId, input)).rejects.toThrow(
        `An active council member is already assigned to the role of ${input.role} in this parish.`
      );
    });

    it('should successfully assign seat if input is valid', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockUserFindById.mockResolvedValue({ id: input.userId });
      mockSeatFindActiveRole.mockResolvedValue(null);
      mockSeatCreate.mockResolvedValue({ id: 'seat-new', ...input });

      const result = await kaleAwadiService.assignSeat(institutionId, input);

      expect(mockSeatCreate).toHaveBeenCalledWith({
        institutionId,
        userId: input.userId,
        role: input.role,
        termStart: input.termStart,
        termEnd: input.termEnd,
        isActive: input.isActive,
      });
      expect(result).toBeDefined();
    });
  });

  describe('deactivateSeat', () => {
    const seatId = 'seat-123';
    const mockUser = { id: 'admin-1', institutionId: 'inst-123' };

    it('should throw NotFoundError if seat does not exist', async () => {
      mockSeatFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.deactivateSeat(seatId, mockUser)).rejects.toThrow(
        `Sebeka Gubae seat assignment with ID ${seatId} not found.`
      );
    });

    it('should assert institution access and deactivate seat if it exists', async () => {
      const mockSeat = { id: seatId, institutionId: 'inst-123', isActive: true };
      mockSeatFindById.mockResolvedValue(mockSeat);
      mockAssertAccess.mockResolvedValue(undefined);
      mockSeatDeactivate.mockResolvedValue({ ...mockSeat, isActive: false });

      const result = await kaleAwadiService.deactivateSeat(seatId, mockUser);

      expect(mockSeatFindById).toHaveBeenCalledWith(seatId);
      expect(mockAssertAccess).toHaveBeenCalledWith(mockUser, 'inst-123', true);
      expect(mockSeatDeactivate).toHaveBeenCalledWith(seatId);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getActiveSeats', () => {
    const institutionId = 'inst-123';

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.getActiveSeats(institutionId)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should return active seats', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      const seats = [{ id: 'seat-1' }];
      mockSeatFindActiveSeats.mockResolvedValue(seats);

      const result = await kaleAwadiService.getActiveSeats(institutionId);

      expect(mockSeatFindActiveSeats).toHaveBeenCalledWith(institutionId);
      expect(result).toEqual(seats);
    });
  });

  describe('recordMinutes', () => {
    const recordedById = 'user-recorder';
    const institutionId = 'inst-123';
    const minutesInput = {
      minuteNumber: 'MN-001',
      meetingDate: new Date('2026-07-10'),
      discussionTopic: 'Finances',
      resolutionsPassed: 'Approve budget',
    };

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.recordMinutes(recordedById, institutionId, minutesInput)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should throw NotFoundError if recorder does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockUserFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.recordMinutes(recordedById, institutionId, minutesInput)).rejects.toThrow(
        `Recording user with ID ${recordedById} not found.`
      );
    });

    it('should successfully record minutes with a cryptographic signature hash', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      mockUserFindById.mockResolvedValue({ id: recordedById });
      mockQaleGubaeCreate.mockResolvedValue({ id: 'minute-123', ...minutesInput });

      const result = await kaleAwadiService.recordMinutes(recordedById, institutionId, minutesInput);

      expect(mockQaleGubaeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          institutionId,
          minuteNumber: minutesInput.minuteNumber,
          meetingDate: minutesInput.meetingDate,
          discussionTopic: minutesInput.discussionTopic,
          resolutionsPassed: minutesInput.resolutionsPassed,
          recordedById,
          signatureHash: expect.any(String),
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('getMinutes', () => {
    const institutionId = 'inst-123';

    it('should throw NotFoundError if institution does not exist', async () => {
      mockInstitutionFindById.mockResolvedValue(null);

      await expect(kaleAwadiService.getMinutes(institutionId)).rejects.toThrow(
        `Institution with ID ${institutionId} not found.`
      );
    });

    it('should return minutes', async () => {
      mockInstitutionFindById.mockResolvedValue({ id: institutionId });
      const minutesList = [{ id: 'min-1' }];
      mockQaleGubaeFindMany.mockResolvedValue(minutesList);

      const result = await kaleAwadiService.getMinutes(institutionId);

      expect(mockQaleGubaeFindMany).toHaveBeenCalledWith(institutionId);
      expect(result).toEqual(minutesList);
    });
  });
});
