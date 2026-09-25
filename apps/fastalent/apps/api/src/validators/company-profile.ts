import { z } from 'zod';
import { CompanySize } from '@gigcruite/types';

/**
 * Company profile validators.
 *
 * Single endpoint — PUT /companies/me — partial update. Every field is
 * optional so the form can submit just the changed subset. Empty strings
 * on optional text fields are translated to `null` so "clear this field"
 * is an explicit gesture.
 *
 * Unlike recruiter profiles, companies have no PII that needs encryption
 * at rest (GST number is a public business registration identifier).
 */

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

/**
 * Indian GSTIN format: 15 characters — 2 state digits, 10-char PAN,
 * 1 entity digit, 1 literal 'Z', 1 checksum alphanumeric.
 * Example: 27AAAPL1234C1Z5
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const UpdateCompanyProfileSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(2, 'Company name is required')
      .max(255)
      .optional(),
    industry: optionalNullableString(100),
    companySize: z
      .preprocess(
        (v) => (v === '' || v === null || v === undefined ? null : v),
        z.nativeEnum(CompanySize).nullable(),
      )
      .optional(),
    website: optionalNullableUrl(500),
    logoUrl: optionalNullableUrl(500),
    description: optionalNullableString(5000),
    foundedYear: z
      .preprocess(
        (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
        z
          .number()
          .int('Founded year must be an integer')
          .min(1800, 'Founded year is too old')
          .max(new Date().getFullYear(), 'Founded year cannot be in the future')
          .nullable(),
      )
      .optional(),
    headquarters: optionalNullableString(255),
    contactPerson: optionalNullableString(255),
    contactPhone: optionalNullableString(20),
    gstNumber: z
      .preprocess(
        (v) =>
          typeof v === 'string' && v.trim() === ''
            ? null
            : typeof v === 'string'
              ? v.trim().toUpperCase()
              : v,
        z
          .string()
          .regex(GSTIN_REGEX, 'Invalid GSTIN format')
          .nullable(),
      )
      .optional(),
    country: z.string().trim().length(2, 'Country code must be 2 characters').toUpperCase().optional(),
    currency: z.string().trim().length(3, 'Currency code must be 3 characters').toUpperCase().optional(),
    defaultCommissionPct: z
      .preprocess(
        (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
        z.number().min(0).max(100).nullable(),
      )
      .optional(),
  })
  .strict();

export type UpdateCompanyProfileInput = z.infer<
  typeof UpdateCompanyProfileSchema
>;
