import { z } from 'zod';
import { PaymentGateway, TransactionStatus, TransactionType } from '@prisma/client';

export const contributeSchema = z.object({
  institutionId: z.string().uuid().optional(),
  amount: z.number().positive({ message: 'Amount must be greater than zero.' }),
  currency: z
    .string()
    .min(3)
    .max(3)
    .transform((value) => value.toUpperCase()),
  type: z.nativeEnum(TransactionType),
  gateway: z.nativeEnum(PaymentGateway),
  referenceId: z.string().min(1).max(128),
});

export type ContributeInput = z.infer<typeof contributeSchema>;

export const listLedgerQuerySchema = z.object({
  institution_id: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type ListLedgerQuery = z.infer<typeof listLedgerQuerySchema>;
