import { Request, Response, NextFunction } from 'express';
import { priestCrmService } from '../services/priest-crm.service';

export class PriestCrmController {
  /**
   * GET /api/v1/priest/my-followers
   */
  async getMyFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const followers = await priestCrmService.getMyFollowers(priestId);

      const delayedCount = followers.filter((f: any) => f.paymentStatus === 'DELAYED').length;

      res.status(200).json({
        success: true,
        data: followers,
        total: followers.length,
        delayedCount,
        message: `ምእምናን ዝርዝር — ${followers.length} follower(s) found. ${delayedCount} with delayed ASRAT.`,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async createFollower(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const follower = await priestCrmService.createFollower(priestId, req.body);
      res.status(201).json({
        success: true,
        data: follower,
        message: 'Follower created successfully.',
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async updateFollower(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const followerId = req.params.id;
      const follower = await priestCrmService.updateFollower(priestId, followerId, req.body);
      res.status(200).json({
        success: true,
        data: follower,
        message: 'Follower updated successfully.',
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async deleteFollower(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const followerId = req.params.id;
      await priestCrmService.deleteFollower(priestId, followerId);
      res.status(200).json({
        success: true,
        message: 'Follower removed successfully.',
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const priestCrmController = new PriestCrmController();
