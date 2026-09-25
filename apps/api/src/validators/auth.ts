import { z } from 'zod';
import { UserRole, CompanySize } from '@gigcruite/types';

/**
 * Strong password policy:
 *   - 12..128 chars
 *   - at least one uppercase, one lowercase, one digit, one special char
 *
 * Matches the founder directive of a trust-first platform — weak passwords
 * are the #1 cause of account takeovers in B2B SaaS.
 */
const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine((v) => /[A-Z]/.test(v), 'Password must contain an uppercase letter')
  .refine((v) => /[a-z]/.test(v), 'Password must contain a lowercase letter')
  .refine((v) => /[0-9]/.test(v), 'Password must contain a digit')
  .refine((v) => /[^A-Za-z0-9]/.test(v), 'Password must contain a special character');

const EmailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(255)
  .transform((v) => v.toLowerCase());

/**
 * Register — discriminated union on role. Only `recruiter` and `company`
 * can self-register; admins are provisioned via the prisma seed.
 *
 * Each branch collects the minimum profile fields needed to create the
 * corresponding RecruiterProfile / CompanyProfile row in the same
 * transaction as the User row.
 */
export const RegisterSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal(UserRole.RECRUITER),
    email: EmailSchema,
    password: PasswordSchema,
    fullName: z.string().trim().min(2, 'Full name is required').max(255),
    phone: z.string().trim().min(5).max(20).optional(),
    country: z.string().trim().length(2).toUpperCase().optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
  }),
  z.object({
    role: z.literal(UserRole.COMPANY),
    email: EmailSchema,
    password: PasswordSchema,
    companyName: z.string().trim().min(2, 'Company name is required').max(255),
    industry: z.string().trim().min(1).max(100).optional(),
    companySize: z.nativeEnum(CompanySize).optional(),
    contactPerson: z.string().trim().min(1).max(255).optional(),
    contactPhone: z.string().trim().min(5).max(20).optional(),
    country: z.string().trim().length(2).toUpperCase().optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
  }),
]);
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  // Do NOT apply PasswordSchema here — users with historically weak passwords
  // must still be able to log in. Only enforce length on the wire.
  password: z.string().min(1, 'Password is required').max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(20).max(255),
  password: PasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const VerifyEmailSchema = z.object({
  token: z.string().min(20).max(255),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
