import { z } from 'zod';

/**
 * Public Lay Donation — Zod Schema
 *
 * Validates inbound requests for POST /api/v1/public/donate.
 * All fields are validated without requiring JWT authentication.
 *
 * ContributionType maps to backend enum values:
 *   TITHE | VOW | MONASTIC_AID | GENERAL
 *
 * PaymentGateway (public subset):
 *   TELEBIRR | CHAPA
 */

export const PublicContributionTypeEnum = z.enum(
  ['TITHE', 'VOW', 'MONASTIC_AID', 'GENERAL'],
  { errorMap: () => ({ message: 'Invalid contribution type. Must be one of: TITHE, VOW, MONASTIC_AID, GENERAL.' }) },
);

export const PublicPaymentGatewayEnum = z.enum(
  ['TELEBIRR', 'CHAPA'],
  { errorMap: () => ({ message: 'Invalid gateway. Must be TELEBIRR or CHAPA.' }) },
);

/** E.164 phone format — accepts +2519XXXXXXXX or +2517XXXXXXXX etc. */
const e164Pattern = /^\+[1-9]\d{6,14}$/;

export const publicDonateSchema = z.object({
  /**
   * Positive decimal amount. Frontend sends as a number;
   * Zod coerces string-numbers gracefully via the refine.
   */
  amount: z
    .number({ invalid_type_error: 'Amount must be a positive number.' })
    .positive({ message: 'Amount must be greater than zero.' }),

  /** Three-letter ISO currency code. Only ETB and USD are routable. */
  currency: z
    .enum(['ETB', 'USD'], {
      errorMap: () => ({ message: 'Currency must be ETB or USD.' }),
    }),

  /** Optional display name; defaults to anonymous sentinel if omitted. */
  donorName: z
    .string()
    .max(120, 'Donor name must not exceed 120 characters.')
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : 'anonymous/ስሙ ያልታወቀ')),

  /** E.164 formatted phone number (required). */
  donorPhone: z
    .string({ required_error: 'Donor phone number is required.' })
    .regex(e164Pattern, {
      message: 'Phone number must be in E.164 format (e.g. +251912345678).',
    }),

  /** Target institution UUID — must be a valid UUID v4. */
  targetTenantId: z
    .string({ required_error: 'targetTenantId is required.' })
    .uuid({ message: 'targetTenantId must be a valid UUID.' }),

  /** Contribution category enum. */
  contributionType: PublicContributionTypeEnum,

  /** Payment gateway selection. */
  gateway: PublicPaymentGatewayEnum,
});

export type PublicDonateInput = z.infer<typeof publicDonateSchema>;

// ── Webhook Verification Schema ──────────────────────────────────────────────

export const publicPaymentWebhookSchema = z.object({
  /** Gateway-issued reference ID — must match an OC-TXN-* record. */
  txnReference: z
    .string({ required_error: 'txnReference is required.' })
    .min(1, 'txnReference must not be empty.'),

  /** Gateway-reported payment status. */
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING'], {
    errorMap: () => ({ message: 'status must be SUCCESS, FAILED, or PENDING.' }),
  }),

  /** Amount settled (must match the original record — gateway echoes it back). */
  amount: z
    .number()
    .positive({ message: 'amount must be positive.' })
    .optional(),
});

export type PublicPaymentWebhookInput = z.infer<typeof publicPaymentWebhookSchema>;
