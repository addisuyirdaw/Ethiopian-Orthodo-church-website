import { ClergyAssignment } from '@prisma/client';
import prisma from '../lib/prisma';

export class ClergyAssignmentRepository {
  /**
   * Finds the first active ClergyAssignment where the given priest holds a
   * canonical role at the given institution on the target date:
   *   assigned_at <= date  AND  (released_at IS NULL  OR  released_at >= date)
   */
  async findActiveAssignment(
    priestId: string,
    institutionId: string,
    date: Date,
  ): Promise<ClergyAssignment | null> {
    return prisma.clergyAssignment.findFirst({
      where: {
        userId: priestId,
        institutionId,
        assignedAt: { lte: date },
        OR: [{ releasedAt: null }, { releasedAt: { gte: date } }],
      },
    });
  }
}

export const clergyAssignmentRepository = new ClergyAssignmentRepository();
