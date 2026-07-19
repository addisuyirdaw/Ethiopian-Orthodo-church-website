import crypto from 'crypto';
import { SebekaGubaeSeat, QaleGubae, CouncilRole } from '@prisma/client';
import { NotFoundError, ConflictError } from '../middleware/error-handler.middleware';
import { sebekaGubaeSeatRepository, CreateSeatAssignmentData } from '../repositories/sebeka-gubae-seat.repository';
import { qaleGubaeRepository, CreateQaleGubaeData } from '../repositories/qale-gubae.repository';
import { institutionRepository } from '../repositories/institution.repository';
import { userRepository } from '../repositories/user.repository';
import { assertInstitutionAccess } from '../middleware/tenant-rbac.middleware';

export class KaleAwadiService {
  async assignSeat(
    institutionId: string,
    data: { userId: string; role: CouncilRole; termStart: Date; termEnd: Date; isActive?: boolean }
  ): Promise<SebekaGubaeSeat> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }

    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found.`);
    }

    // Enforce Kale Awadi: only one active seat per role per parish
    if (data.isActive !== false) {
      const activeRole = await sebekaGubaeSeatRepository.findActiveRoleInInstitution(institutionId, data.role);
      if (activeRole) {
        throw new ConflictError(`An active council member is already assigned to the role of ${data.role} in this parish.`);
      }
    }

    const assignmentData: CreateSeatAssignmentData = {
      institutionId,
      userId: data.userId,
      role: data.role,
      termStart: data.termStart,
      termEnd: data.termEnd,
      isActive: data.isActive,
    };

    return sebekaGubaeSeatRepository.create(assignmentData);
  }

  async deactivateSeat(id: string, user: any): Promise<SebekaGubaeSeat> {
    const seat = await sebekaGubaeSeatRepository.findById(id);
    if (!seat) {
      throw new NotFoundError(`Sebeka Gubae seat assignment with ID ${id} not found.`);
    }
    await assertInstitutionAccess(user, seat.institutionId, true);
    return sebekaGubaeSeatRepository.deactivate(id);
  }

  async getActiveSeats(institutionId: string): Promise<SebekaGubaeSeat[]> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }
    return sebekaGubaeSeatRepository.findActiveSeatsByInstitution(institutionId);
  }

  async recordMinutes(
    recordedById: string,
    institutionId: string,
    data: { minuteNumber: string; meetingDate: Date; discussionTopic: string; resolutionsPassed: string }
  ): Promise<QaleGubae> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }

    const recorder = await userRepository.findById(recordedById);
    if (!recorder) {
      throw new NotFoundError(`Recording user with ID ${recordedById} not found.`);
    }

    // Cryptographic hash of minutes content to sign the entry in the immutable ledger
    const dataToHash = `${data.minuteNumber}|${data.meetingDate.toISOString()}|${data.discussionTopic}|${data.resolutionsPassed}|${recordedById}`;
    const signatureHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    const minutesData: CreateQaleGubaeData = {
      institutionId,
      minuteNumber: data.minuteNumber,
      meetingDate: data.meetingDate,
      discussionTopic: data.discussionTopic,
      resolutionsPassed: data.resolutionsPassed,
      recordedById,
      signatureHash,
    };

    return qaleGubaeRepository.create(minutesData);
  }

  async getMinutes(institutionId: string): Promise<QaleGubae[]> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }
    return qaleGubaeRepository.findManyForInstitution(institutionId);
  }
}

export const kaleAwadiService = new KaleAwadiService();
