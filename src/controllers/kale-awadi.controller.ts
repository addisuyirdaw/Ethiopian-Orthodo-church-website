import { Request, Response, NextFunction } from 'express';
import { seatAssignmentSchema, qaleGubaeMinutesSchema, dualAuthorizationRequestSchema, dualAuthorizationApprovalSchema } from '../validators/kale-awadi.validator';
import { kaleAwadiService } from '../services/kale-awadi.service';
import { governanceService } from '../services/governance.service';
import { UnauthorizedError } from '../middleware/error-handler.middleware';

export class KaleAwadiController {
  async assignSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = seatAssignmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }

      const institutionId = req.resolvedInstitutionId ?? parseResult.data.institutionId;

      const result = await kaleAwadiService.assignSeat(institutionId, parseResult.data);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seatId } = req.params;
      if (!seatId) {
        res.status(400).json({ error: 'Bad Request', message: 'seatId is required.' });
        return;
      }

      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = await kaleAwadiService.deactivateSeat(seatId, req.user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.params.institutionId ?? req.query.institutionId ?? req.user?.institutionId;
      if (!institutionId || typeof institutionId !== 'string') {
        res.status(400).json({ error: 'Bad Request', message: 'institutionId is required.' });
        return;
      }

      const result = await kaleAwadiService.getActiveSeats(institutionId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordMinutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to record minutes.');
      }

      const parseResult = qaleGubaeMinutesSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }

      const institutionId = req.resolvedInstitutionId ?? parseResult.data.institutionId;

      const result = await kaleAwadiService.recordMinutes(
        req.user.id,
        institutionId,
        parseResult.data
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMinutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionId = req.params.institutionId ?? req.query.institutionId ?? req.user?.institutionId;
      if (!institutionId || typeof institutionId !== 'string') {
        res.status(400).json({ error: 'Bad Request', message: 'institutionId is required.' });
        return;
      }

      const result = await kaleAwadiService.getMinutes(institutionId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /governance/request-action
   * 
   * Create a new dual-authorization request for a sensitive governance action.
   * The requesting user must have CHAIRPERSON, DEPUTY_CHAIRPERSON, or ACCOUNTANT role.
   * 
   * Per Ethiopian Orthodox Tewahedo Church Administrative Constitution (2009 E.C. 4th Edition),
   * actions requiring dual authorization include bank withdrawals, asset disposals, and budget modifications.
   */
  async requestAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const parseResult = dualAuthorizationRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }

      const { institutionId, payloadType, payloadJson } = parseResult.data;

      // Verify the requesting user matches the institution (or has admin override)
      if (req.user.institutionId !== institutionId && req.user.authRole !== 'SYSTEM_ADMIN') {
        throw new UnauthorizedError('User does not have access to this institution.');
      }

      const result = await governanceService.requestAction(
        institutionId,
        payloadType,
        payloadJson,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          institutionId: result.institutionId,
          payloadType: result.payloadType,
          status: result.status,
          createdAt: result.createdAt,
        },
        message: 'Dual-authorization request created. Awaiting CHAIRPERSON and DEPUTY_CHAIRPERSON approval.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /governance/approve-action
   * 
   * Approve or reject a pending dual-authorization request.
   * Only CHAIRPERSON or DEPUTY_CHAIRPERSON can approve.
   * Both approvals are required for the request status to change to APPROVED.
   * A single rejection immediately sets status to REJECTED.
   */
  async approveAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required.');
      }

      const parseResult = dualAuthorizationApprovalSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }

      const { requestId, approve, rejectionReason } = parseResult.data;

      const result = await governanceService.approveAction(
        requestId,
        req.user.id,
        approve,
        rejectionReason
      );

      const statusMessage = result.status === 'APPROVED'
        ? 'Request approved by both CHAIRPERSON and DEPUTY_CHAIRPERSON. Action is ready for execution.'
        : result.status === 'REJECTED'
        ? `Request rejected. Reason: ${result.rejectedReason}`
        : 'Approval recorded. Awaiting second approval from either CHAIRPERSON or DEPUTY_CHAIRPERSON.';

      res.status(200).json({
        success: true,
        data: {
          id: result.id,
          status: result.status,
          chairApproved: result.chairApproved,
          deputyApproved: result.deputyApproved,
          chairApprovedAt: result.chairApprovedAt,
          deputyApprovedAt: result.deputyApprovedAt,
          rejectedReason: result.rejectedReason,
          updatedAt: result.updatedAt,
        },
        message: statusMessage,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const kaleAwadiController = new KaleAwadiController();
