import { z } from 'zod';

// ── Baptism Registration ───────────────────────────────────────────────────────

export const registerBaptismSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  firstNameAm: z.string().max(255).optional(),
  lastNameAm: z.string().max(255).optional(),
  firstNameGez: z.string().max(255).optional(),
  lastNameGez: z.string().max(255).optional(),
  christianName: z.string().min(1).max(255),
  baptismDate: z.string().datetime({ message: 'baptismDate must be an ISO 8601 datetime string.' }),
  baptizingPriestId: z.string().uuid({ message: 'baptizingPriestId must be a valid UUID.' }),
  parishId: z.string().uuid({ message: 'parishId must be a valid UUID.' }),
});

export type RegisterBaptismDto = z.infer<typeof registerBaptismSchema>;

// ── Marriage Verify-and-Register ───────────────────────────────────────────────

export const verifyAndRegisterMarriageSchema = z.object({
  husbandSacramentalId: z
    .string()
    .min(1)
    .regex(/^OC-REG-\d{4}-[A-F0-9]{8}$/, {
      message: 'husbandSacramentalId must follow the OC-REG-YEAR-RANDOM format.',
    }),
  wifeSacramentalId: z
    .string()
    .min(1)
    .regex(/^OC-REG-\d{4}-[A-F0-9]{8}$/, {
      message: 'wifeSacramentalId must follow the OC-REG-YEAR-RANDOM format.',
    }),
  marriageDate: z.string().datetime({ message: 'marriageDate must be an ISO 8601 datetime string.' }),
  officiatingPriestId: z.string().uuid({ message: 'officiatingPriestId must be a valid UUID.' }),
  parishId: z.string().uuid({ message: 'parishId must be a valid UUID.' }),
  witnessNames: z
    .array(z.string().min(1))
    .min(2, { message: 'At least two witnesses are required by canonical law.' }),
});

export type VerifyAndRegisterMarriageDto = z.infer<typeof verifyAndRegisterMarriageSchema>;
