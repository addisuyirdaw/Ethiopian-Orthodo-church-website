import { QaleGubae } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateQaleGubaeData {
  institutionId: string;
  minuteNumber: string;
  meetingDate: Date;
  discussionTopic: string;
  resolutionsPassed: string;
  recordedById: string;
  signatureHash: string;
}

export class QaleGubaeRepository {
  async create(data: CreateQaleGubaeData): Promise<QaleGubae> {
    return prisma.qaleGubae.create({
      data: {
        institutionId: data.institutionId,
        minuteNumber: data.minuteNumber,
        meetingDate: data.meetingDate,
        discussionTopic: data.discussionTopic,
        resolutionsPassed: data.resolutionsPassed,
        recordedById: data.recordedById,
        signatureHash: data.signatureHash,
      },
      include: {
        recordedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async findManyForInstitution(institutionId: string): Promise<QaleGubae[]> {
    return prisma.qaleGubae.findMany({
      where: { institutionId },
      orderBy: { meetingDate: 'desc' },
      include: {
        recordedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }
}

export const qaleGubaeRepository = new QaleGubaeRepository();
