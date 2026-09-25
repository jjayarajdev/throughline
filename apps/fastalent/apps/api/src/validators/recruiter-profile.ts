import { z } from 'zod';

/**
 * Recruiter profile validators.
 *
 * Two distinct endpoints:
 *   - PUT /recruiters/me              → UpdateRecruiterProfileSchema (non-PII)
 *   - PUT /recruiters/me/bank-details → UpdateRecruiterBankDetailsSchema (PII)
 *
 * The PII fields are split into a dedicated endpoint so we can:
 *   1. Apply tighter audit logging + rate limiting to the bank path.
 *   2. Require ALL bank fields at once (partial updates would corrupt
 *      the encrypted blob — you can't swap a bank account without a
 *      matching holder name).
 *   3. Keep the general profile PUT free of regex-heavy validation.
 */

// -------------------- helpers --------------------

/**
 * Transform empty string → null so form-sent "" clears optional fields.
 * Otherwise `""` would pass a .min(1) check and be persisted as blank.
 */
const emptyStringToNull = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.any(),
);

const optionalNullableString = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const optionalNullableUrl = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().url('Must be a valid URL').max(max).nullable().optional(),
  );

// -------------------- update profile --------------------

export const UpdateRecruiterProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required').max(255).optional(),
    phone: optionalNullableString(20),
    avatarUrl: optionalNullableUrl(500),
    bio: optionalNullableString(2000),
    yearsOfExperience: z
      .preprocess(
        (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
        z
          .number()
          .int('Years of experience must be an integer')
          .min(0, 'Years of experience cannot be negative')
          .max(80, 'Years of experience is unreasonable')
          .nullable(),
      )
      .optional(),
    specializations: z
      .array(z.string().trim().min(1).max(100))
      .max(20, 'No more than 20 specializations')
      .optional(),
    linkedinUrl: optionalNullableUrl(500),
    country: z.string().trim().length(2, 'Country code must be 2 characters').toUpperCase().optional(),
    currency: z.string().trim().length(3, 'Currency code must be 3 characters').toUpperCase().optional(),
  })
  .strict();

export type UpdateRecruiterProfileInput = z.infer<
  typeof UpdateRecruiterProfileSchema
>;

// -------------------- update bank details --------------------

/**
 * Indian PAN format: AAAAA9999A
 *   - 5 uppercase letters
 *   - 4 digits
 *   - 1 uppercase letter
 */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * Indian IFSC format: AAAA0NNNNNN
 *   - 4 uppercase letters (bank code)
 *   - 1 zero (reserved)
 *   - 6 alphanumerics (branch code)
 */
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const UpdateRecruiterBankDetailsSchema = z
  .object({
    pan: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(PAN_REGEX, 'Invalid PAN format (AAAAA9999A)')),
    bankAccount: z
      .string()
      .trim()
      .regex(/^[0-9]{6,18}$/, 'Bank account must be 6–18 digits'),
    bankIfsc: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(
        z
          .string()
          .regex(IFSC_REGEX, 'Invalid IFSC format (AAAA0NNNNNN)'),
      ),
    bankAccountHolderName: z
      .string()
      .trim()
      .min(2, 'Holder name is required')
      .max(255),
  })
  .strict();

export type UpdateRecruiterBankDetailsInput = z.infer<
  typeof UpdateRecruiterBankDetailsSchema
>;

// Suppress unused helper warning — kept for symmetry if other schemas need it.
void emptyStringToNull;
