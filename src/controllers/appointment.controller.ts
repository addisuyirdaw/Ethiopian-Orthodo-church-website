import { Request, Response, NextFunction } from 'express';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { appointmentService } from '../services/appointment.service';

export class AppointmentController {
  /** POST /api/v1/appointments — Follower books an appointment */
  async book(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user!.id;
      const { priestId, appointmentType, requestedDate, requestedDateEth, followerNote } = req.body;

      if (!priestId || !requestedDate) {
        res.status(400).json({ error: 'priestId and requestedDate are required.' });
        return;
      }
      if (appointmentType && !Object.values(AppointmentType).includes(appointmentType)) {
        res.status(400).json({ error: `Invalid appointmentType. Valid: ${Object.values(AppointmentType).join(', ')}` });
        return;
      }

      const result = await appointmentService.bookAppointment(followerId, {
        priestId,
        appointmentType: appointmentType ?? AppointmentType.GENERAL,
        requestedDate,
        requestedDateEth,
        followerNote,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/appointments/my — Follower sees their own appointments */
  async myAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user!.id;
      const data = await appointmentService.getFollowerAppointments(followerId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/appointments/priest — Priest sees their queue */
  async priestQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const { status } = req.query as { status?: AppointmentStatus };
      const data = await appointmentService.getPriestAppointments(priestId, status);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/appointments/priest/stats — Priest dashboard counts */
  async priestStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const stats = await appointmentService.getPriestStats(priestId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/appointments/:id/decide — Priest approves/rejects/reschedules */
  async decide(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user!.id;
      const { id } = req.params;
      const { decision, confirmedDate, priestNote } = req.body;

      if (!['APPROVE', 'REJECT', 'RESCHEDULE', 'COMPLETE'].includes(decision)) {
        res.status(400).json({ error: 'decision must be one of: APPROVE, REJECT, RESCHEDULE, COMPLETE' });
        return;
      }
      if (decision === 'RESCHEDULE' && !confirmedDate) {
        res.status(400).json({ error: 'confirmedDate is required for RESCHEDULE.' });
        return;
      }

      const result = await appointmentService.decideAppointment(priestId, id, { decision, confirmedDate, priestNote });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
  /** GET /api/v1/appointments/:id — Follower views specific appointment */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user!.id;
      const { id } = req.params;
      const data = await appointmentService.getAppointmentById(followerId, id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/v1/appointments/:id/cancel — Follower cancels pending appointment */
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user!.id;
      const { id } = req.params;
      const result = await appointmentService.cancelAppointment(followerId, id);
      res.json({ success: true, data: result, message: 'ቀጠሮው በተሳካ ሁኔታ ተሰርዟል።' });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();

