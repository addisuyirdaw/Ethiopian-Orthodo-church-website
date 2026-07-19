import { z } from 'zod';
import { CounselingType, CatechismStatus } from '@prisma/client';

// ─── Spiritual Roster Validators ──────────────────────────────────────────────

export const addSpiritualChildSchema = z.object({
  priestUserId:         z.string().uuid('ትክክለኛ የካህን ተጠቃሚ መለያ (UUID) ሊሰጥ ይገባል።'),
  spiritualChildUserId: z.string().uuid('ትክክለኛ የምእመን ተጠቃሚ መለያ (UUID) ሊሰጥ ይገባል።'),
});

export type AddSpiritualChildInput = z.infer<typeof addSpiritualChildSchema>;

// ─── Counseling Log Validators ────────────────────────────────────────────────

export const logCounselingSessionSchema = z.object({
  rosterId: z.string().uuid('ትክክለኛ የዝርዝር መለያ (UUID) ሊሰጥ ይገባል።'),
  date: z
    .string()
    .datetime({ message: 'ቀኑ ትክክለኛ ISO 8601 ቀን-ሰዓት ቅርጸት መሆን አለበት።' })
    .transform((s) => new Date(s)),
  type: z.nativeEnum(CounselingType, {
    errorMap: () => ({
      message: 'ያልተፈቀደ የምክር አይነት: INTRODUCTORY, REGULAR_CONFESSION, CANONICAL_REVIEW, ወይም PRE_MARITAL ሊሆን ይችላል።',
    }),
  }),
  isCanonFulfilled: z.boolean({
    required_error: 'የቀኖና ፍጻሜ ሁኔታ ሊሰጥ ይገባል።',
  }),
  encryptedNextSteps: z.string().max(4096).optional(),
});

export type LogCounselingSessionInput = z.infer<typeof logCounselingSessionSchema>;

// ─── Catechumen Advance Validators ────────────────────────────────────────────

export const advanceCatechumenSchema = z.object({
  targetStatus: z.nativeEnum(CatechismStatus, {
    errorMap: () => ({
      message:
        'ያልተፈቀደ የምርቃና ሁኔታ: ENROLLED, INSTRUCTION, EXAMINATION, READY_FOR_BAPTISM, ወይም BAPTIZED ሊሆን ይችላል።',
    }),
  }),
});

export type AdvanceCatechumenInput = z.infer<typeof advanceCatechumenSchema>;

// ─── Catechumen List Query Validators ─────────────────────────────────────────

export const listCatechumensSchema = z.object({
  status: z.nativeEnum(CatechismStatus).optional(),
});

export type ListCatechumensQuery = z.infer<typeof listCatechumensSchema>;

// ─── Priest-Follower Assignment & Confession Validators ─────────────────────

/**
 * Validator for MIMEN (followers) to assign themselves to a priest.
 * Section: የነፍስ አባት ምረጫ (Spiritual Father Selection)
 */
export const assignPriestSchema = z.object({
  priestUserId: z
    .string({ required_error: 'priestUserId is required.' })
    .uuid({ message: 'priestUserId must be a valid UUID.' })
    .describe('The UUID of the priest (User with PRIEST ecclesiastical role)'),
});

export type AssignPriestInput = z.infer<typeof assignPriestSchema>;

/**
 * Validator for priests to log a confession/counseling session with a follower.
 * Section: ቦታ/ፍርድ-ሪደምታ-ቀኖና (Confession & Penance Recording)
 */
export const logConfessionSchema = z.object({
  parishionerId: z
    .string({ required_error: 'parishionerId is required.' })
    .uuid({ message: 'parishionerId must be a valid UUID.' })
    .describe('The UUID of the parishioner (follower) confessing'),
  notes: z
    .string()
    .max(2000, 'Confession notes cannot exceed 2000 characters.')
    .optional()
    .describe('Encrypted confession summary (stored securely).'),
  penanceText: z
    .string()
    .max(500, 'Penance text cannot exceed 500 characters.')
    .optional()
    .describe('The prescribed penance (ቀኖና) - e.g., "40-day fast"'),
  nextScheduledDate: z
    .string()
    .datetime({ message: 'nextScheduledDate must be a valid ISO 8601 datetime.' })
    .transform((s) => new Date(s))
    .optional()
    .describe('Next scheduled confession date'),
});

export type LogConfessionInput = z.infer<typeof logConfessionSchema>;

/**
 * Validator for retrieving a priest's spiritual children (followers).
 */
export const listSpiritualChildrenSchema = z.object({
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default('50')
    .optional(),
  offset: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0))
    .default('0')
    .optional(),
});

export type ListSpiritualChildrenQuery = z.infer<typeof listSpiritualChildrenSchema>;
