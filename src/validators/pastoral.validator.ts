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
