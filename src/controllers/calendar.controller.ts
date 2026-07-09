import { Request, Response } from 'express';
import { calendarService } from '../services/calendar.service';
import { calendarTodayQuerySchema } from '../validators/calendar.validator';
import { formatIsoDate } from '../lib/calendar-utils';

export class CalendarController {
  async today(req: Request, res: Response): Promise<void> {
    const query = calendarTodayQuerySchema.parse(req.query);
    const institutionId = req.resolvedInstitutionId ?? req.user!.institutionId;

    const now = new Date();
    const defaultDate = formatIsoDate(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
    );
    const targetDateIso = query.date ?? defaultDate;

    const context = await calendarService.getDailyLiturgicalContext(
      institutionId,
      targetDateIso,
      req.headers['accept-language'],
    );

    res.status(200).json({
      data: {
        calendars: context.calendars,
        fasting: context.fasting,
        liturgical: context.liturgical,
      },
      meta: context.meta,
    });
  }
}

export const calendarController = new CalendarController();
