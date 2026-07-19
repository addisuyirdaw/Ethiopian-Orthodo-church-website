import { Request, Response } from 'express';
import { clergyLedgerService } from '../services/clergy/clergy-ledger.service';
import { CanonicalStatusException } from '../middleware/error-handler.middleware';
import prisma from '../lib/prisma';

export class ClergyController {
  /**
   * GET /api/v1/clergy/verify/:clergyId
   *
   * Queries the canonical status of a clergy member by profile ID or user ID.
   * Returns a structured verification payload, or throws CanonicalStatusException
   * with an Amharic-first error message if the clergy is not in active standing.
   */
  async verify(req: Request, res: Response): Promise<void> {
    const { clergyId } = req.params;
    const isAuthorized = await clergyLedgerService.verifyClergySacramentalAuthority(clergyId);

    res.status(200).json({
      data: {
        clergyId,
        verified: isAuthorized,
        canonicalStatus: 'ACTIVE_GOOD_STANDING',
        message: 'ይህ አገልጋይ ምስጢራትን ለመፈጸም ሥልጣን አለው። (Clergy authority confirmed: Active good standing.)',
      },
    });
  }

  /**
   * GET /api/v1/clergy
   *
   * Returns a list of all active clergy members in the parish registry.
   */
  async list(req: Request, res: Response): Promise<void> {
    const clergyList = await (prisma as any).clergy.findMany({
      where: { isActive: true },
      orderBy: { ordainedNameEn: 'asc' },
    });

    res.status(200).json({
      data: clergyList,
    });
  }
}

export const clergyController = new ClergyController();

