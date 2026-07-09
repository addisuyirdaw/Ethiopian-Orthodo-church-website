import { z } from 'zod';

export const calendarTodayQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format.' })
    .optional(),
  institution_id: z.string().uuid().optional(),
});

export type CalendarTodayQuery = z.infer<typeof calendarTodayQuerySchema>;
