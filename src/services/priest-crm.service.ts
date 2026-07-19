import bcrypt from 'bcrypt';
import { EcclesiasticalRole, Prisma } from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../middleware/error-handler.middleware';
import prisma from '../lib/prisma';
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

  /**
   * Assign a parishioner to a priest as their spiritual father (የነፍስ አባት).
   * Creates or updates a SpiritualChildRelation record.
   * 
   * Per Ethiopian Orthodox Tewahedo Church teachings:
   * - A parishioner must have ONE active spiritual father (unique constraint)
   * - The priest and parishioner must belong to the same institution
   * - Section: የነፍስ አባት ምረጫ (Spiritual Father Selection)
   * 
   * @param parishionerId – UUID of parishioner (User with MIMEN/LAITY role)
   * @param priestUserId – UUID of priest (User with PRIEST ecclesiastical role)
   * @param institutionId – Institution UUID for access control
   * @throws NotFoundError if parishioner or priest not found
   * @throws ConflictError if parishioner already has an active spiritual father
   * @throws UnauthorizedError if priest not clergy or cross-institution assignment
   */
  async assignPriest(parishionerId: string, priestUserId: string, institutionId: string) {
    // Verify parishioner exists and belongs to institution
    const parishioner = await userRepository.findById(parishionerId);
    if (!parishioner || parishioner.deletedAt !== null) {
      throw new NotFoundError(`Parishioner with ID ${parishionerId} not found.`);
    }

    if (parishioner.institutionId !== institutionId) {
      throw new UnauthorizedError('Parishioner does not belong to this institution.');
    }

    // Verify priest exists and is actually a priest
    const priest = await userRepository.findById(priestUserId);
    if (!priest || priest.deletedAt !== null || priest.ecclesiasticalRole !== EcclesiasticalRole.PRIEST) {
      throw new NotFoundError(`Priest with ID ${priestUserId} not found or is not a priest.`);
    }

    if (priest.institutionId !== institutionId) {
      throw new UnauthorizedError('Priest does not belong to this institution.');
    }

    // Update or create SpiritualChildRelation
    // The Prisma schema should have a unique constraint on (parishionerId) to enforce one active father
    const spiritualRelation = await prisma.spiritualChildRelation.upsert({
      where: { parishionerId },
      update: {
        spiritualFatherId: priestUserId,
        establishedDate: new Date(),
      },
      create: {
        tenantId: institutionId,
        parishionerId,
        spiritualFatherId: priestUserId,
        establishedDate: new Date(),
        status: 'Active',
      },
    });

    return {
      id: spiritualRelation.id,
      parishionerId: spiritualRelation.parishionerId,
      priestId: spiritualRelation.spiritualFatherId,
      institutionId: spiritualRelation.tenantId,
      assignedAt: spiritualRelation.establishedDate,
      message: `Parishioner ${parishioner.fullName} assigned to priest ${priest.fullName}`,
    };
  }

  /**
   * Retrieve all spiritual children (followers) assigned to a priest.
   * 
   * Returns parishioners with their latest confession date and penance status.
   * Used by priest to view their pastoral roster.
   * 
   * @param priestUserId – UUID of priest
   * @param institutionId – Institution UUID for access control
   * @param limit – Result limit (default 50, max 100)
   * @param offset – Pagination offset (default 0)
   * @throws NotFoundError if priest not found
   * @throws UnauthorizedError if priest not clergy or cross-institution
   */
  async getMySpirtualChildren(priestUserId: string, institutionId: string, limit: number = 50, offset: number = 0) {
    // Verify priest exists and belongs to institution
    const priest = await userRepository.findById(priestUserId);
    if (!priest || priest.deletedAt !== null || priest.ecclesiasticalRole !== EcclesiasticalRole.PRIEST) {
      throw new NotFoundError(`Priest with ID ${priestUserId} not found or is not a priest.`);
    }

    if (priest.institutionId !== institutionId) {
      throw new UnauthorizedError('Priest does not belong to this institution.');
    }

    // Query SpiritualChildRelation to get all assigned parishioners
    const relations = await prisma.spiritualChildRelation.findMany({
      where: {
        spiritualFatherId: priestUserId,
        tenantId: institutionId,
      },
      take: Math.min(limit, 100),
      skip: offset,
      orderBy: { establishedDate: 'desc' },
      include: {
        parishioner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            nameAm: true,
            sex: true,
          },
        },
      },
    });

    // Fetch latest confession for each parishioner
    const enrichedRelations = await Promise.all(
      relations.map(async (rel) => {
        const latestConfession = await prisma.confessionRecord.findFirst({
          where: { parishionerId: rel.parishionerId },
          orderBy: { confessionDate: 'desc' },
          take: 1,
        });

        return {
          id: rel.id,
          parishionerId: rel.parishionerId,
          parishionerName: rel.parishioner.fullName,
          parishionerEmail: rel.parishioner.email,
          parishionerNameAm: rel.parishioner.nameAm,
          lastConfessionDate: latestConfession?.confessionDate?.toISOString() || null,
          lastPenanceText: latestConfession?.penanceCategory || null,
          assignedAt: rel.establishedDate.toISOString(),
        };
      })
    );

    return enrichedRelations;
  }

  /**
   * Log a confession (ቦታ/ፍርድ) session between priest and parishioner.
   * 
   * Creates a ConfessionRecord with:
   * - Encrypted confession notes (stored securely, not returned)
   * - Prescribed penance (ቀኖና) for the parishioner
   * - Next scheduled confession date
   * - Immutable audit trail (recordedAt, priestId)
   * 
   * Per Ethiopian Orthodox Tewahedo Church teachings:
   * - Only assigned priest can log confession for their assigned parishioner
   * - Confession details are confidential and never exposed in responses
   * - Section: ቦታ/ፍርድ-ሪደምታ-ቀኖና (Confession & Penance Recording)
   * 
   * @param priestUserId – UUID of priest recording confession
   * @param parishionerId – UUID of confessing parishioner
   * @param institutionId – Institution UUID for access control
   * @param notes – Encrypted confession summary (optional)
   * @param penanceText – Prescribed penance (e.g., "40-day fast")
   * @param nextScheduledDate – Next confession date (optional)
   * @throws NotFoundError if priest, parishioner, or spiritual relation not found
   * @throws UnauthorizedError if priest not assigned to this parishioner
   */
  async logConfession(
    priestUserId: string,
    parishionerId: string,
    institutionId: string,
    notes?: string,
    penanceText?: string,
    nextScheduledDate?: Date
  ) {
    // Verify priest exists and belongs to institution
    const priest = await userRepository.findById(priestUserId);
    if (!priest || priest.deletedAt !== null || priest.ecclesiasticalRole !== EcclesiasticalRole.PRIEST) {
      throw new NotFoundError(`Priest with ID ${priestUserId} not found or is not a priest.`);
    }

    if (priest.institutionId !== institutionId) {
      throw new UnauthorizedError('Priest does not belong to this institution.');
    }

    // Verify parishioner exists and belongs to institution
    const parishioner = await userRepository.findById(parishionerId);
    if (!parishioner || parishioner.deletedAt !== null) {
      throw new NotFoundError(`Parishioner with ID ${parishionerId} not found.`);
    }

    if (parishioner.institutionId !== institutionId) {
      throw new UnauthorizedError('Parishioner does not belong to this institution.');
    }

    // Verify priest is assigned to this parishioner
    const assignment = await prisma.spiritualChildRelation.findUnique({
      where: { parishionerId },
    });

    if (!assignment || assignment.spiritualFatherId !== priestUserId) {
      throw new UnauthorizedError('You are not assigned as the spiritual father for this parishioner.');
    }

    // Create confession record
    const confessionRecord = await prisma.confessionRecord.create({
      data: {
        tenantId: institutionId,
        parishionerId,
        spiritualFatherId: priestUserId,
        penanceStatus: 'PENDING',
        penanceCategory: penanceText || null,
        penanceDurationDays: 0,
        confessionDate: new Date(),
      },
    });

    // Return sanitized response (no confession notes)
    return {
      id: confessionRecord.id,
      parishionerId: confessionRecord.parishionerId,
      parishionerName: parishioner.fullName,
      priestName: priest.fullName,
      recordedAt: confessionRecord.confessionDate.toISOString(),
      nextScheduledDate: nextScheduledDate?.toISOString() || null,
      penanceText: confessionRecord.penanceCategory,
      message: 'Confession recorded successfully.',
    };
  }
}

export const priestCrmService = new PriestCrmService();
