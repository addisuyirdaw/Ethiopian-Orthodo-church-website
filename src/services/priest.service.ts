import prisma from '../lib/prisma';
import { ConfessionRecord, User } from '@prisma/client';

export class PriestService {
  /**
   * Retrieves all spiritual children (parishioners/laity) assigned to a given priest.
   */
  async getChildren(priestId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        spiritualFatherId: priestId,
        deletedAt: null,
      },
      orderBy: {
        fullName: 'asc',
      },
    });
  }

  /**
   * Retrieves all pending confession records/appointments for a priest.
   */
  async getPendingAppointments(priestId: string): Promise<any[]> {
    return prisma.confessionRecord.findMany({
      where: {
        spiritualFatherId: priestId,
        penanceStatus: 'PENDING',
      },
      include: {
        parishioner: true,
      },
      orderBy: {
        confessionDate: 'asc',
      },
    });
  }

  /**
   * Approves, rejects, or reschedules an appointment/confession record.
   */
  async decideAppointment(
    priestId: string,
    appointmentId: string,
    decision: 'APPROVE' | 'REJECT' | 'RESCHEDULE',
    newDate?: string
  ): Promise<ConfessionRecord> {
    const updateData: any = {
      penanceStatus: decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'RESCHEDULED',
    };
    if (decision === 'RESCHEDULE' && newDate) {
      updateData.confessionDate = new Date(newDate);
    }

    return prisma.confessionRecord.update({
      where: {
        id: appointmentId,
        spiritualFatherId: priestId,
      },
      data: updateData,
    });
  }

  /**
   * Upserts a pastoral log / confession counseling session for a spiritual child.
   */
  async upsertPastoralLog(
    priestId: string,
    childId: string,
    content: string
  ): Promise<ConfessionRecord> {
    // Find the priest to get their institution (tenantId)
    const priest = await prisma.user.findFirst({
      where: { id: priestId },
      select: { institutionId: true },
    });
    const tenantId = priest?.institutionId ?? 'global';

    // Find if there is a recent confession record to update or create a new one
    const existing = await prisma.confessionRecord.findFirst({
      where: {
        spiritualFatherId: priestId,
        parishionerId: childId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existing) {
      return prisma.confessionRecord.update({
        where: { id: existing.id },
        data: {
          penanceCategory: content,
          updatedAt: new Date(),
        },
      });
    }

    return prisma.confessionRecord.create({
      data: {
        tenantId,
        parishionerId: childId,
        spiritualFatherId: priestId,
        penanceStatus: 'COMPLETED',
        penanceCategory: content,
        penanceDurationDays: 0,
      },
    });
  }
}

export const priestService = new PriestService();
export default priestService;
