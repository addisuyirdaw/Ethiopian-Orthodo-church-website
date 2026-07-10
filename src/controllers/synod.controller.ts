import { Request, Response } from 'express';
import { z } from 'zod';
import { BallotChoice } from '@prisma/client';
import { synodEngineService } from '../services/synod/synod-engine.service';

const castBallotSchema = z.object({
  choice: z.nativeEnum(BallotChoice, {
    errorMap: () => ({ message: 'choice must be one of APPROVE, REJECT, or ABSTAIN.' }),
  }),
});

export class SynodController {
  async vote(req: Request, res: Response): Promise<void> {
    const { id: decreeId } = req.params;
    const clerkId = req.user!.id;

    const body = castBallotSchema.parse(req.body);

    const result = await synodEngineService.castSynodBallot(
      clerkId,
      decreeId,
      body.choice,
    );

    res.status(201).json({
      data: {
        ballot: {
          id: result.ballot.id,
          decreeId: result.ballot.decreeId,
          clerkId: result.ballot.clerkId,
          choice: result.ballot.choice,
          castAt: result.ballot.castAt,
        },
        decree: {
          id: result.decree.id,
          title: result.decree.title,
          status: result.decree.status,
          quorumRequired: result.decree.quorumRequired,
          passingPercentage: result.decree.passingPercentage,
          expiresAt: result.decree.expiresAt,
        },
      },
      message: 'Ballot successfully cast.',
    });
  }
}

export const synodController = new SynodController();
