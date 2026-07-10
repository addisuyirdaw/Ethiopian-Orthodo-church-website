import { Request, Response } from 'express';
import { synodalAnalyticsService } from '../services/synodal/synodal-analytics.service';
import {
  getDiocesanMetricsSchema,
  executeClergyTransferSchema,
} from '../validators/synodal.validator';

export class SynodalController {
  /**
   * GET /api/v1/synodal/analytics/:dioceseId
   * Retrieves aggregate metrics for a diocese node and all its child nodes.
   * Restricts access hierarchically.
   */
  async getDiocesanMetrics(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const { dioceseId } = getDiocesanMetricsSchema.parse(req.params);

    const metrics = await synodalAnalyticsService.getDiocesanAggregateMetrics(
      user.id,
      dioceseId
    );

    res.status(200).json({ data: metrics });
  }

  /**
   * POST /api/v1/synodal/clergy/transfer
   * Reassigns a clergy member to a new institution node.
   */
  async executeClergyTransfer(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    const input = executeClergyTransferSchema.parse(req.body);

    const newHistory = await synodalAnalyticsService.executeClergyTransfer(
      user.id,
      {
        clergyId: input.clergyId,
        toInstitutionId: input.toInstitutionId,
      }
    );

    res.status(201).json({
      data: newHistory,
      message: 'የአገልጋይ ዝውውር በተሳካ ሁኔታ ተጠናቋል።',
    });
  }
}

export const synodalController = new SynodalController();
