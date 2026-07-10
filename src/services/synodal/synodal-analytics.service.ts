import prisma from '../../lib/prisma';
import {
  ForbiddenError,
  NotFoundError,
} from '../../middleware/error-handler.middleware';
import { isSameOrDownstreamInstitution } from '../../types';

export class SynodalAnalyticsService {
  /**
   * Aggregates metrics (total parishioners and active clergy positions)
   * across all downstream institutions for a specific diocese.
   *
   * Gated to users with role 'BISHOP' or 'DIOCESAN_ADMIN' who are authorized to access the requested diocese tree.
   */
  async getDiocesanAggregateMetrics(executiveUserId: string, dioceseId: string) {
    const executiveUser = await prisma.user.findFirst({
      where: { id: executiveUserId, deletedAt: null },
      include: { institution: true },
    });

    if (!executiveUser) {
      throw new NotFoundError('Executive user not found.');
    }

    const role = executiveUser.ecclesiasticalRole as string;
    const isAuthorizedRole = role === 'BISHOP' || role === 'DIOCESAN_ADMIN';

    if (!isAuthorizedRole) {
      throw new ForbiddenError('AccessDenied: Executive role check failed.');
    }

    const diocese = await prisma.institution.findFirst({
      where: { id: dioceseId, deletedAt: null },
    });

    if (!diocese) {
      throw new NotFoundError('Diocese not found.');
    }

    // Verify executive has hierarchy access to diocese tree
    const hasAccess = isSameOrDownstreamInstitution(
      executiveUser.institution.hierarchyPath,
      diocese.hierarchyPath
    );

    if (!hasAccess) {
      throw new ForbiddenError('AccessDenied: Hierarchy boundary mismatch.');
    }

    // Retrieve all descendants (including itself)
    const descendants = await prisma.institution.findMany({
      where: {
        hierarchyPath: { startsWith: diocese.hierarchyPath },
        deletedAt: null,
      },
      include: {
        users: {
          where: { deletedAt: null },
          select: { ecclesiasticalRole: true },
        },
      },
    });

    let totalParishioners = 0;
    let activeClergy = 0;

    for (const inst of descendants) {
      for (const u of inst.users) {
        if (u.ecclesiasticalRole === 'LAITY') {
          totalParishioners++;
        } else {
          activeClergy++;
        }
      }
    }

    return {
      dioceseId,
      dioceseName: diocese.name,
      totalParishioners,
      activeClergy,
    };
  }

  /**
   * Executes a clerical transfer inside an atomic transaction:
   * 1. End dates the active clergy assignment history record (if exists).
   * 2. Creates a new assignment history record.
   * 3. Updates primary user location pointer (institutionId).
   * 4. Updates ClergyProfile currentAssignmentId.
   */
  async executeClergyTransfer(
    authorizerId: string,
    payload: { clergyId: string; toInstitutionId: string }
  ) {
    return prisma.$transaction(
      async (tx) => {
        const clergyUser = await tx.user.findFirst({
          where: { id: payload.clergyId, deletedAt: null },
        });

        if (!clergyUser) {
          throw new NotFoundError('Clergy user not found.');
        }

        const toInst = await tx.institution.findFirst({
          where: { id: payload.toInstitutionId, deletedAt: null },
        });

        if (!toInst) {
          throw new NotFoundError('Destination institution not found.');
        }

        const now = new Date();

        // 1. Locate and end-date current active assignment
        const currentActive = await tx.clergyAssignmentHistory.findFirst({
          where: {
            clergyUserId: payload.clergyId,
            endDate: null,
          },
          orderBy: { startDate: 'desc' },
        });

        if (currentActive) {
          await tx.clergyAssignmentHistory.update({
            where: { id: currentActive.id },
            data: { endDate: now },
          });
        }

        // 2. Create new assignment history
        const fromInstitutionId = currentActive ? currentActive.toInstitutionId : null;
        const newHistory = await tx.clergyAssignmentHistory.create({
          data: {
            clergyUserId: payload.clergyId,
            fromInstitutionId,
            toInstitutionId: payload.toInstitutionId,
            startDate: now,
            endDate: null,
            authorizedByUserId: authorizerId,
          },
        });

        // 3. Update primary location pointer on User profile
        await tx.user.update({
          where: { id: payload.clergyId },
          data: { institutionId: payload.toInstitutionId },
        });

        // 4. Update currentAssignmentId on ClergyProfile (if exists)
        const profile = await tx.clergyProfile.findFirst({
          where: { userId: payload.clergyId },
        });

        if (profile) {
          await tx.clergyProfile.update({
            where: { id: profile.id },
            data: { currentAssignmentId: payload.toInstitutionId },
          });
        }

        return newHistory;
      },
      { isolationLevel: 'Serializable' }
    );
  }
}

export const synodalAnalyticsService = new SynodalAnalyticsService();
