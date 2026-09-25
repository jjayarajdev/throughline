import { z } from 'zod';

export const SeedWalletSchema = z
  .object({
    companyUserId: z.string().uuid('Invalid company user ID'),
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .finite()
      .positive('Amount must be greater than zero')
      .max(10_00_000, 'Single seed cannot exceed ₹10,00,000'),
  })
  .strict();

export const SeedRecruiterBankSchema = z
  .object({
    recruiterUserId: z.string().uuid('Invalid recruiter user ID'),
  })
  .strict();

export const SetUserStatusSchema = z
  .object({
    userId: z.string().uuid('Invalid user ID'),
    status: z.enum(['active', 'inactive', 'blocked', 'pending_verification']),
    emailVerified: z.boolean().optional(),
  })
  .strict();

export type SeedWalletBody = z.infer<typeof SeedWalletSchema>;
export type SeedRecruiterBankBody = z.infer<typeof SeedRecruiterBankSchema>;
export type SetUserStatusBody = z.infer<typeof SetUserStatusSchema>;
