import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export const SignupSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  fullName: z.string().min(1, { message: 'Full name is required.' }),
  sex: z.enum(['MALE', 'FEMALE'], { required_error: 'Sex is required.' }),
  age: z.number().int().min(12, { message: 'Minimum age is 12.' }).max(120, { message: 'Age must be 120 or below.' }),
  institutionId: z.string().uuid({ message: 'Institution ID must be a valid UUID.' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
