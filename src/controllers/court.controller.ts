import { Request, Response } from 'express';
import { canonicalCourtService } from '../services/canonical/court.service';
import {
  createCanonicalCaseSchema,
  listCasesQuerySchema,
  mutateStandingSchema,
} from '../validators/court.validator';

export class CourtController {
  /**
   * GET /api/v1/canonical-court/cases
   * Lists all canonical cases visible to the authenticated user's tenant.
   * Only judicially-cleared roles may access this endpoint.
   */
  async listCases(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { caseType } = listCasesQuerySchema.parse(req.query);

    const cases = await canonicalCourtService.listCasesForTenant(
      user.id,
      user.institutionId,
      { caseType },
    );

    res.status(200).json({ data: cases });
  }

  /**
   * POST /api/v1/canonical-court/cases
   * Files a new canonical case. Sensitive party details are encrypted at rest.
   */
  async createCase(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const payload = createCanonicalCaseSchema.parse(req.body);

    const newCase = await canonicalCourtService.createCanonicalCase(
      user.id,
      user.institutionId,
      payload,
    );

    res.status(201).json({
      data: newCase,
      message: 'ቀኖናዊ ጉዳይ በተሳካ ሁኔታ ተመዝግቧል።',
    });
  }

  /**
   * POST /api/v1/canonical-court/standing
   * Mutates a clergy member's canonical standing.
   * Exclusively gated to episcopal roles (BISHOP and above).
   */
  async mutateStanding(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const payload = mutateStandingSchema.parse(req.body);

    const statusLog = await canonicalCourtService.mutateClergyStanding(user.id, {
      targetUserId: payload.targetUserId,
      newStanding: payload.newStanding,
      reason: payload.reason,
    });

    res.status(200).json({
      data: statusLog,
      message: 'የቀሳውስቱ ቀኖናዊ አቋም በተሳካ ሁኔታ ተቀይሯል።',
    });
  }
}

export const courtController = new CourtController();
