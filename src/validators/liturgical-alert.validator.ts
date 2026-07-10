import { z } from 'zod';
import { AlertFastingThreshold } from '@prisma/client';

// ─── Shared ───────────────────────────────────────────────────────────────────

export const institutionIdQuerySchema = z.object({
  institution_id: z.string().uuid('institution_id must be a valid UUID').optional(),
});

// ─── Subscription update ──────────────────────────────────────────────────────

export const updateSubscriptionSchema = z
  .object({
    lookAheadDays: z
      .number({ invalid_type_error: 'lookAheadDays must be a number.' })
      .int('lookAheadDays must be an integer.')
      .min(1, 'lookAheadDays must be at least 1.')
      .max(30, 'lookAheadDays must be at most 30.')
      .optional(),
    fastingThreshold: z
      .nativeEnum(AlertFastingThreshold, {
        errorMap: () => ({
          message: `fastingThreshold must be one of: ${Object.values(AlertFastingThreshold).join(', ')}.`,
        }),
      })
      .optional(),
    isEnabled: z
      .boolean({ invalid_type_error: 'isEnabled must be a boolean.' })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field (lookAheadDays, fastingThreshold, isEnabled) must be provided.' },
  );

export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
