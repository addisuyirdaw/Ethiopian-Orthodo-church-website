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
  institutionId: z.string().uuid({ message: 'Institution ID must be a valid UUID.' }).optional(),
  christianName: z.string().optional(),
  birthDate: z.string().optional(), // ISO date string
  phoneNumber: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  baptismStatus: z.string().optional(),
  photoUrl: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

