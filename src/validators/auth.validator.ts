import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
