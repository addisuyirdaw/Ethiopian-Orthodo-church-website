import bcrypt from 'bcrypt';
import { EcclesiasticalRole, Prisma } from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../middleware/error-handler.middleware';
import { institutionRepository } from '../repositories/institution.repository';
import { parishLedgerRepository } from '../repositories/parish-ledger.repository';
import { userRepository } from '../repositories/user.repository';

export interface FollowerProfile {
  id: string;
  fullName: string;
  email: string;
  nameAm: string | null;
  nameGez: string | null;
  sex: string | null;
  location: string | null;
  institutionId: string;
  ecclesiasticalRole: string;
  lastAsratDate: string | null;
  paymentStatus?: 'DELAYED';
}

export interface CreateFollowerInput {
  email: string;
  password: string;
  fullName: string;
  sex?: 'MALE' | 'FEMALE' | null;
  location?: string | null;
}

export interface UpdateFollowerInput {
  email?: string;
  password?: string;
  fullName?: string;
  sex?: 'MALE' | 'FEMALE' | null;
  location?: string | null;
}

export class PriestCrmService {
  private async buildFollowerProfile(user: Prisma.UserGetPayload<{ select: {
    id: true;
    email: true;
    fullName: true;
    nameAm: true;
    nameGez: true;
    sex: true;
    location: true;
    institutionId: true;
    ecclesiasticalRole: true;
  } }>) {
    const latestAsrat = await parishLedgerRepository.findLatestAsratByUserId(user.id);
    const lastAsratDate = latestAsrat ? latestAsrat.createdAt.toISOString() : null;
    const now = Date.now();

    let paymentStatus: 'DELAYED' | undefined;
    if (!latestAsrat) {
      paymentStatus = 'DELAYED';
    } else {
      const daysSinceLastPayment = (now - latestAsrat.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPayment > 30) {
        paymentStatus = 'DELAYED';
      }
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      nameAm: user.nameAm,
      nameGez: user.nameGez,
      sex: user.sex,
      location: user.location,
      institutionId: user.institutionId,
      ecclesiasticalRole: user.ecclesiasticalRole,
      lastAsratDate,
      ...(paymentStatus ? { paymentStatus } : {}),
    } as FollowerProfile;
  }

  async createFollower(priestId: string, input: CreateFollowerInput): Promise<FollowerProfile> {
    const priest = await userRepository.findById(priestId);
    if (!priest || priest.deletedAt !== null || priest.ecclesiasticalRole !== EcclesiasticalRole.PRIEST) {
      throw new UnauthorizedError('Only priests may create spiritual followers.');
    }

    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with that email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = await userRepository.createUser({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      ecclesiasticalRole: EcclesiasticalRole.LAITY,
      sex: input.sex ?? null,
      location: input.location ?? null,
      nameEn: input.fullName,
      nameAm: null,
      nameGez: null,
      spiritualFather: {
        connect: { id: priestId },
      },
      institution: {
        connect: { id: priest.institutionId },
      },
    });

    return this.buildFollowerProfile(created as any);
  }

  async updateFollower(priestId: string, followerId: string, input: UpdateFollowerInput): Promise<FollowerProfile> {
    const follower = await userRepository.findById(followerId);
    if (!follower || follower.deletedAt !== null) {
      throw new NotFoundError('Follower not found.');
    }
    if (follower.spiritualFatherId !== priestId) {
      throw new ForbiddenError('You may only update followers assigned to your own spiritual care.');
    }

    if (input.email && input.email !== follower.email) {
      const duplicate = await userRepository.findByEmail(input.email);
      if (duplicate) {
        throw new ConflictError('Another account is already registered with this email.');
      }
    }

    const updatePayload: Prisma.UserUpdateInput = {
      email: input.email,
      fullName: input.fullName,
      sex: input.sex ?? undefined,
      location: input.location ?? undefined,
    };

    if (input.password) {
      updatePayload.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updated = await userRepository.updateById(followerId, updatePayload);
    return this.buildFollowerProfile(updated as any);
  }

  async deleteFollower(priestId: string, followerId: string): Promise<void> {
    const follower = await userRepository.findById(followerId);
    if (!follower || follower.deletedAt !== null) {
      throw new NotFoundError('Follower not found.');
    }
    if (follower.spiritualFatherId !== priestId) {
      throw new ForbiddenError('You may only remove followers assigned to your own spiritual care.');
    }

    await userRepository.softDelete(followerId);
  }

  async getMyFollowers(priestId: string) {
    const followers = await parishLedgerRepository.findFollowersByPriestId(priestId);
    return followers.map((user) => {
      const latestAsrat = user.parishLedgerEntries?.[0];
      const lastAsratDate = latestAsrat ? latestAsrat.createdAt.toISOString() : null;
      const now = Date.now();
      const delayed = !latestAsrat || (now - latestAsrat.createdAt.getTime()) / (1000 * 60 * 60 * 24) > 30;

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        nameAm: user.nameAm,
        nameGez: user.nameGez,
        sex: user.sex,
        location: user.location,
        institutionId: user.institutionId,
        ecclesiasticalRole: user.ecclesiasticalRole,
        lastAsratDate,
        ...(delayed ? { paymentStatus: 'DELAYED' } : {}),
      } as FollowerProfile;
    });
  }

  async listPriestsByInstitution(institutionId: string) {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution || institution.deletedAt !== null) {
      throw new NotFoundError('Institution not found.');
    }

    return institutionRepository.findPriestsByInstitution(institutionId);
  }
}

export const priestCrmService = new PriestCrmService();
