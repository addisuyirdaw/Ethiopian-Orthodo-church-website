import { z } from 'zod';
import { OfferingCategory, ContributionStatus } from '@prisma/client';

export const initializeContributionSchema = z.object({
  institutionId: z.string().uuid().optional(), // For admin override
  amount: z.number().positive({ message: 'Amount must be greater than zero.' }),
  currency: z
    .string()
    .min(3)
    .max(3)
    .transform((value) => value.toUpperCase()),
  category: z.nativeEnum(OfferingCategory, {
    errorMap: () => ({ message: 'Invalid offering category.' }),
  }),
  gateway: z.string().min(1, { message: 'Payment gateway is required.' }),
  vowDetails: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export type InitializeContributionInput = z.infer<typeof initializeContributionSchema>;

export const finalizeContributionWebhookSchema = z.object({
  gatewayReference: z.string().min(1, { message: 'gatewayReference is required.' }),
  status: z.nativeEnum(ContributionStatus, {
    errorMap: () => ({ message: 'Invalid contribution status.' }),
  }),
});

export type FinalizeContributionWebhookInput = z.infer<typeof finalizeContributionWebhookSchema>;
