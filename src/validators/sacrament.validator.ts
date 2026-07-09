import { z } from 'zod';
import { SacramentalType } from '@prisma/client';

const calendarMetadataSchema = z
  .object({
    gregorian: z.string().optional(),
    julian: z.string().optional(),
    ethiopic: z.string().optional(),
    feastOrFast: z.string().optional(),
    liturgicalNotes: z.string().optional(),
  })
  .passthrough();

export const createSacramentSchema = z.object({
  type: z.nativeEnum(SacramentalType),
  targetUserId: z.string().uuid().optional().nullable(),
  christianName: z.string().min(1).max(255),
  celebrantPriestId: z.string().uuid(),
  sponsorName: z.string().max(500).optional().nullable(),
  eventDateUtc: z.string().datetime({ message: 'eventDateUtc must be ISO 8601 datetime' }),
  calendarMetadata: calendarMetadataSchema,
  isCanonicalVerified: z.boolean().optional().default(false),
});

export type CreateSacramentInput = z.infer<typeof createSacramentSchema>;

export const listSacramentsQuerySchema = z.object({
  institution_id: z.string().uuid().optional(),
  type: z.nativeEnum(SacramentalType).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type ListSacramentsQuery = z.infer<typeof listSacramentsQuerySchema>;
