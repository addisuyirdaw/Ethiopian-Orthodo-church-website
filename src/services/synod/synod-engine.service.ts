import { BallotChoice, DecreeStatus, OrdinationRank, CanonicalStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  ForbiddenError,
  NotFoundError,
  CanonicalValidationError,
} from '../../middleware/error-handler.middleware';

export class SynodEngineService {
  async castSynodBallot(
    clerkId: string,
    decreeId: string,
    choice: BallotChoice,
  ) {
    return prisma.$transaction(async (tx) => {
      // a. Fetch the voting user's ClergyProfile
      const profile = await tx.clergyProfile.findFirst({
        where: {
          OR: [
            { id: clerkId },
            { userId: clerkId },
          ],
        },
      });

      if (!profile) {
        throw new ForbiddenError('Clergy profile not found.');
      }

      // Validate ordinationRank is BISHOP or higher
      const isEpiscopal = (
        [
          OrdinationRank.BISHOP,
          OrdinationRank.METROPOLITAN,
          OrdinationRank.PATRIARCH,
        ] as OrdinationRank[]
      ).includes(profile.ordinationRank);

      if (!isEpiscopal) {
        throw new ForbiddenError('Only bishops or higher ordination ranks are authorized to vote.');
      }

      // b. Fetch the target SynodDecree
      const decree = await tx.synodDecree.findUnique({
        where: { id: decreeId },
      });

      if (!decree) {
        throw new NotFoundError(`Decree with ID ${decreeId} not found.`);
      }

      const now = new Date();
      const isExpired = now > decree.expiresAt;

      // c. Check if the decree's status is active and not expired
      if (decree.status !== DecreeStatus.ACTIVE_VOTING) {
        if (isExpired) {
          const updatedDecree = await this.evaluateAndClose(tx, decree);
          throw new CanonicalValidationError('The voting period has closed.');
        }
        throw new CanonicalValidationError('Decree is not active for voting.');
      }

      if (isExpired) {
        const updatedDecree = await this.evaluateAndClose(tx, decree);
        throw new CanonicalValidationError('The voting period has closed.');
      }

      // d. Check for duplicate ballots
      const existingBallot = await tx.synodBallot.findUnique({
        where: {
          decreeId_clerkId: {
            decreeId,
            clerkId: profile.id,
          },
        },
      });

      if (existingBallot) {
        throw new CanonicalValidationError('You have already cast a ballot for this decree.');
      }

      // e. Create the new SynodBallot entry
      const ballot = await tx.synodBallot.create({
        data: {
          decreeId,
          clerkId: profile.id,
          choice,
        },
      });

      // f. Query all ballots cast for this decree so far
      const ballots = await tx.synodBallot.findMany({
        where: { decreeId },
      });

      const totalVotes = ballots.length;
      const approveCount = ballots.filter((b) => b.choice === BallotChoice.APPROVE).length;
      const rejectCount = ballots.filter((b) => b.choice === BallotChoice.REJECT).length;
      const nonAbstainCount = approveCount + rejectCount;
      const approvalPercentage = nonAbstainCount > 0 ? (approveCount / nonAbstainCount) * 100 : 0;

      // Fetch all active bishops in good standing
      const totalBishops = await tx.clergyProfile.count({
        where: {
          ordinationRank: {
            in: [OrdinationRank.BISHOP, OrdinationRank.METROPOLITAN, OrdinationRank.PATRIARCH],
          },
          canonicalStatus: CanonicalStatus.ACTIVE_GOOD_STANDING,
        },
      });

      const allBishopsVoted = totalVotes >= totalBishops;

      let finalStatus: DecreeStatus = decree.status;

      // g. Evaluate terminal resolution constraints
      if (isExpired || allBishopsVoted) {
        if (totalVotes < decree.quorumRequired) {
          finalStatus = DecreeStatus.REJECTED;
        } else {
          if (approvalPercentage >= decree.passingPercentage) {
            finalStatus = DecreeStatus.PASSED;
          } else {
            finalStatus = DecreeStatus.REJECTED;
          }
        }

        const updatedDecree = await tx.synodDecree.update({
          where: { id: decreeId },
          data: { status: finalStatus },
        });

        return { ballot, decree: updatedDecree };
      }

      return { ballot, decree };
    });
  }

  private async evaluateAndClose(tx: any, decree: any): Promise<any> {
    const ballots = await tx.synodBallot.findMany({
      where: { decreeId: decree.id },
    });

    const totalBishops = await tx.clergyProfile.count({
      where: {
        ordinationRank: {
          in: [OrdinationRank.BISHOP, OrdinationRank.METROPOLITAN, OrdinationRank.PATRIARCH],
        },
        canonicalStatus: CanonicalStatus.ACTIVE_GOOD_STANDING,
      },
    });

    const totalVotes = ballots.length;
    const approveCount = ballots.filter((b: any) => b.choice === BallotChoice.APPROVE).length;
    const rejectCount = ballots.filter((b: any) => b.choice === BallotChoice.REJECT).length;
    const nonAbstainCount = approveCount + rejectCount;
    const approvalPercentage = nonAbstainCount > 0 ? (approveCount / nonAbstainCount) * 100 : 0;

    let finalStatus: DecreeStatus = DecreeStatus.REJECTED;
    if (totalVotes >= decree.quorumRequired) {
      if (approvalPercentage >= decree.passingPercentage) {
        finalStatus = DecreeStatus.PASSED;
      }
    }

    return tx.synodDecree.update({
      where: { id: decree.id },
      data: { status: finalStatus },
    });
  }
}

export const synodEngineService = new SynodEngineService();
