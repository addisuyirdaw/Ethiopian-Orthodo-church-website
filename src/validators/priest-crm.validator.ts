import { z } from 'zod';
import { Sex } from '@prisma/client';

export const createFollowerSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  sex: z.nativeEnum(Sex).optional().nullable(),
  location: z.string().optional().nullable(),
});

export const updateFollowerSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }).optional(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional(),
  fullName: z.string().min(1, { message: 'Full name is required.' }).optional(),
  sex: z.nativeEnum(Sex).optional().nullable(),
  location: z.string().optional().nullable(),
});

export type CreateFollowerDto = z.infer<typeof createFollowerSchema>;
export type UpdateFollowerDto = z.infer<typeof updateFollowerSchema>;
