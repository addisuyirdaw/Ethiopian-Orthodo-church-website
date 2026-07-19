import { SebekaGubaeSeat, CouncilRole } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateSeatAssignmentData {
  institutionId: string;
  userId: string;
  role: CouncilRole;
  termStart: Date;
  termEnd: Date;
  isActive?: boolean;
}

export class SebekaGubaeSeatRepository {
  async create(data: CreateSeatAssignmentData): Promise<SebekaGubaeSeat> {
    return prisma.sebekaGubaeSeat.create({
      data: {
        institutionId: data.institutionId,
        userId: data.userId,
        role: data.role,
        termStart: data.termStart,
        termEnd: data.termEnd,
        isActive: data.isActive ?? true,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async deactivate(id: string): Promise<SebekaGubaeSeat> {
    return prisma.sebekaGubaeSeat.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findActiveRoleInInstitution(institutionId: string, role: CouncilRole): Promise<SebekaGubaeSeat | null> {
    return prisma.sebekaGubaeSeat.findFirst({
      where: {
        institutionId,
        role,
        isActive: true,
      },
    });
  }

  async findActiveSeatsByInstitution(institutionId: string): Promise<SebekaGubaeSeat[]> {
    return prisma.sebekaGubaeSeat.findMany({
      where: {
        institutionId,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { role: 'asc' },
    });
  }

  async findActiveSeatByUser(userId: string): Promise<SebekaGubaeSeat[]> {
    return prisma.sebekaGubaeSeat.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findById(id: string): Promise<SebekaGubaeSeat | null> {
    return prisma.sebekaGubaeSeat.findUnique({
      where: { id },
    });
  }

  async findActiveByUserAndInstitution(userId: string, institutionId: string): Promise<SebekaGubaeSeat | null> {
    return prisma.sebekaGubaeSeat.findFirst({
      where: {
        userId,
        institutionId,
        isActive: true,
      },
    });
  }
}

export const sebekaGubaeSeatRepository = new SebekaGubaeSeatRepository();
