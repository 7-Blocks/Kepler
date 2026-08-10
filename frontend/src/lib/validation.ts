import { z } from 'zod';

const email = z.email('Enter a valid email address');

/** Sign-in only requires a well-formed email and a non-empty password. */
export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

/** Sign-up enforces the full password policy and confirmation match. */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name is too short')
      .max(80, 'Full name is too long'),
    email,
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Add at least one uppercase letter')
      .regex(/[a-z]/, 'Add at least one lowercase letter')
      .regex(/[0-9]/, 'Add at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Add at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
