import { z } from 'zod';
import { PaymentProvider } from '@prisma/client';

export const PaymentProviderEnum = z.nativeEnum(PaymentProvider, {
  errorMap: () => ({ message: 'Invalid payment provider. Must be TELEBIRR, CBE_BIRR, STRIPE, or CHAPA.' }),
});

export const merchantConfigSchema = z.object({
  institutionId: z
    .string({ required_error: 'institutionId is required.' })
    .uuid({ message: 'institutionId must be a valid UUID.' }),
  provider: PaymentProviderEnum,
  isActive: z.boolean().optional(),
  configPayload: z
    .record(z.any(), { required_error: 'configPayload is required.' })
    .or(z.object({})),
});

export const initiatePaymentSchema = z.object({
  institutionId: z
    .string({ required_error: 'institutionId is required.' })
    .uuid({ message: 'institutionId must be a valid UUID.' }),
  amount: z
    .number({ invalid_type_error: 'Amount must be a positive number.' })
    .positive({ message: 'Amount must be greater than zero.' }),
  currency: z
    .enum(['ETB', 'USD'], {
      errorMap: () => ({ message: 'Currency must be ETB or USD.' }),
    })
    .default('ETB'),
  provider: PaymentProviderEnum,
  userId: z
    .string()
    .uuid({ message: 'userId must be a valid UUID.' })
    .optional()
    .nullable(),
});

export const paymentWebhookSchema = z.object({
  txnReference: z
    .string({ required_error: 'txnReference is required.' })
    .min(1, 'txnReference must not be empty.'),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING'], {
    errorMap: () => ({ message: 'status must be SUCCESS, FAILED, or PENDING.' }),
  }),
  amount: z
    .number()
    .positive({ message: 'amount must be positive.' })
    .optional(),
});

export type MerchantConfigInput = z.infer<typeof merchantConfigSchema>;
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;
