import { Request, Response, NextFunction } from 'express';
import { priestService } from '../services/priest.service';
import { auditLogRepository } from '../repositories/audit-log.repository';

export class PriestController {
  async getChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const children = await priestService.getChildren(priestId);
      res.status(200).json({ data: children, message: 'Spiritual children fetched.' });
    } catch (error) {
      next(error);
    }
  }

  async getPendingAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const appointments = await priestService.getPendingAppointments(priestId);
      res.status(200).json({ data: appointments, message: 'Pending appointments fetched.' });
    } catch (error) {
      next(error);
    }
  }

  async decideAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const { id } = req.params;
      const { decision, newDate } = req.body as { decision: 'APPROVE' | 'REJECT' | 'RESCHEDULE'; newDate?: string };
      const updated = await priestService.decideAppointment(priestId, id, decision, newDate);
      await auditLogRepository.create({
        actorId: priestId,
        institutionId: req.user!.institutionId,
        action: `APPOINTMENT_${decision}`,
        tableName: 'ConfessionRecord',
        recordId: id,
        changes: updated as any,
      });
      res.status(200).json({ data: updated, message: `Appointment ${decision.toLowerCase()}d.` });
    } catch (error) {
      next(error);
    }
  }

  async upsertPastoralLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const { childId } = req.params;
      const { content } = req.body as { content: string };
      const log = await priestService.upsertPastoralLog(priestId, childId, content);
      await auditLogRepository.create({
        actorId: priestId,
        institutionId: req.user!.institutionId,
        action: 'CREATE_PASTORAL_LOG',
        tableName: 'ConfessionRecord',
        recordId: log.id,
        changes: { content },
      });
      res.status(200).json({ data: log, message: 'Pastoral log saved.' });
    } catch (error) {
      next(error);
    }
  }
}

export const priestController = new PriestController();
