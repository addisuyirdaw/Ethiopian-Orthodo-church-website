import { z } from 'zod';
import { CouncilRole } from '@prisma/client';

export const CouncilRoleEnum = z.nativeEnum(CouncilRole, {
  errorMap: () => ({ message: 'Invalid council role. Must be one of: LIQE_MENBER, MEK_LIQE_MENBER, WANA_TSEHAFI, GENZEB_YAZHI, HISAB_SHUM.' }),
});

export const seatAssignmentSchema = z.object({
  institutionId: z
    .string({ required_error: 'institutionId is required.' })
    .uuid({ message: 'institutionId must be a valid UUID.' }),
  userId: z
    .string({ required_error: 'userId is required.' })
    .uuid({ message: 'userId must be a valid UUID.' }),
  role: CouncilRoleEnum,
  termStart: z
    .string({ required_error: 'termStart is required.' })
    .datetime({ message: 'termStart must be a valid ISO 8601 datetime string.' })
    .pipe(z.coerce.date()),
  termEnd: z
    .string({ required_error: 'termEnd is required.' })
    .datetime({ message: 'termEnd must be a valid ISO 8601 datetime string.' })
    .pipe(z.coerce.date()),
  isActive: z.boolean().optional(),
}).refine((data) => data.termEnd > data.termStart, {
  message: 'termEnd must be after termStart.',
  path: ['termEnd'],
});

export const qaleGubaeMinutesSchema = z.object({
  institutionId: z
    .string({ required_error: 'institutionId is required.' })
    .uuid({ message: 'institutionId must be a valid UUID.' }),
  minuteNumber: z
    .string({ required_error: 'minuteNumber is required.' })
    .min(1, 'minuteNumber must not be empty.'),
  meetingDate: z
    .string({ required_error: 'meetingDate is required.' })
    .datetime({ message: 'meetingDate must be a valid ISO 8601 datetime string.' })
    .pipe(z.coerce.date()),
  discussionTopic: z
    .string({ required_error: 'discussionTopic is required.' })
    .min(1, 'discussionTopic must not be empty.'),
  resolutionsPassed: z
    .string({ required_error: 'resolutionsPassed is required.' })
    .min(1, 'resolutionsPassed must not be empty.'),
});

export type SeatAssignmentInput = z.infer<typeof seatAssignmentSchema>;
export type QaleGubaeMinutesInput = z.infer<typeof qaleGubaeMinutesSchema>;

// ── Dual Authorization Workflow Validators ────────────────────────────────────

export const dualAuthorizationRequestSchema = z.object({
  institutionId: z
    .string({ required_error: 'institutionId is required.' })
    .uuid({ message: 'institutionId must be a valid UUID.' }),
  payloadType: z
    .string({ required_error: 'payloadType is required.' })
    .min(1, 'payloadType must not be empty.'),
  payloadJson: z
    .record(z.any())
    .or(z.string())
    .refine(
      (val) => {
        if (typeof val === 'string') {
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        }
        return true;
      },
      { message: 'payloadJson must be a valid JSON string or object.' },
    ),
});

export const dualAuthorizationApprovalSchema = z.object({
  requestId: z
    .string({ required_error: 'requestId is required.' })
    .uuid({ message: 'requestId must be a valid UUID.' }),
  approve: z
    .boolean({ required_error: 'approve is required (true or false).' }),
  rejectionReason: z
    .string()
    .optional()
    .refine(
      (val) => !val || (typeof val === 'string' && val.length > 0),
      { message: 'rejectionReason must be a non-empty string if provided.' },
    ),
});

export type DualAuthorizationRequestInput = z.infer<typeof dualAuthorizationRequestSchema>;
export type DualAuthorizationApprovalInput = z.infer<typeof dualAuthorizationApprovalSchema>;
