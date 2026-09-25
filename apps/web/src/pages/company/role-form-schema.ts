import { z } from 'zod';
import { EMPLOYMENT_TYPES, PayoutMode, PayoutType, RoleType, RoleVisibility } from '@gigcruite/types';

/**
 * Client-side Zod schema for the role create/edit form.
 * Mirrors `apps/api/src/validators/role.ts` — server remains source of
 * truth but we replicate here so field errors show inline.
 *
 * All numeric fields enter the form as strings (text/number inputs) and
 * are coerced with `z.coerce.number()` so the form itself stays simple.
 */

const PAYOUT_MAX_INR = 50_00_000;

export const RoleFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
    description: z
      .string()
      .trim()
      .min(30, 'Description must be at least 30 characters')
      .max(10_000),
    roleType: z.nativeEnum(RoleType),
    visibility: z.nativeEnum(RoleVisibility),
    location: z.string().trim().min(2, 'Location is required').max(255),
    country: z.string().trim().max(100).optional(),
    isRemote: z.boolean(),
    employmentType: z.enum(EMPLOYMENT_TYPES, {
      errorMap: () => ({ message: 'Please select an employment type' }),
    }),
    experienceMin: z.coerce.number().int().min(0).max(50),
    experienceMax: z.coerce.number().int().min(0).max(50),
    /** Comma-separated on the form; split into an array at submit time. */
    skillsCsv: z.string().trim().max(1000),
    ctcMin: z.coerce.number().nonnegative(),
    ctcMax: z.coerce.number().nonnegative(),
    payoutType: z.nativeEnum(PayoutType),
    shortlistPayoutMode: z.nativeEnum(PayoutMode).optional(),
    shortlistPayoutValue: z.coerce
      .number()
      .positive('Shortlist payout value must be greater than zero')
      .max(PAYOUT_MAX_INR, `Cannot exceed ₹${PAYOUT_MAX_INR.toLocaleString('en-IN')}`)
      .optional()
      .or(z.literal(0).transform(() => undefined)),
    hirePayoutMode: z.nativeEnum(PayoutMode).optional(),
    hirePayoutValue: z.coerce
      .number()
      .positive('Hire payout value must be greater than zero')
      .max(PAYOUT_MAX_INR, `Cannot exceed ₹${PAYOUT_MAX_INR.toLocaleString('en-IN')}`)
      .optional()
      .or(z.literal(0).transform(() => undefined)),
    maxSubmissions: z.coerce.number().int().min(1).max(500),
    maxPerRecruiter: z.coerce.number().int().min(1).max(100),
    openPositions: z.coerce.number().int().min(1).max(100),
    jdS3Key: z.string().nullable().optional().default(null),
    jdOriginalFilename: z.string().nullable().optional().default(null),
    jdSizeBytes: z.number().nullable().optional().default(null),
    jdMimeType: z.string().nullable().optional().default(null),
  })
  .superRefine((d, ctx) => {
    if (d.ctcMax < d.ctcMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ctcMax'],
        message: 'Maximum CTC must be ≥ minimum CTC',
      });
    }
    if (d.experienceMax < d.experienceMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['experienceMax'],
        message: 'Max experience must be ≥ min experience',
      });
    }
    if (d.maxSubmissions < d.maxPerRecruiter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxSubmissions'],
        message: 'Max submissions must be ≥ max per recruiter',
      });
    }
    if (d.payoutType === PayoutType.PER_SHORTLIST || d.payoutType === PayoutType.HYBRID) {
      if (!d.shortlistPayoutValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shortlistPayoutValue'],
          message: 'Shortlist payout value is required',
        });
      }
    }
    if (d.payoutType === PayoutType.PER_HIRE || d.payoutType === PayoutType.HYBRID) {
      if (!d.hirePayoutValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hirePayoutValue'],
          message: 'Hire payout value is required',
        });
      }
    }
  });

export type RoleFormValues = z.infer<typeof RoleFormSchema>;

export const DEFAULT_ROLE_FORM: RoleFormValues = {
  title: '',
  description: '',
  roleType: RoleType.REGULAR,
  visibility: RoleVisibility.OPEN,
  location: '',
  country: undefined,
  isRemote: false,
  employmentType: 'full_time',
  experienceMin: 0,
  experienceMax: 5,
  skillsCsv: '',
  ctcMin: 500000,
  ctcMax: 1500000,
  payoutType: PayoutType.PER_HIRE,
  shortlistPayoutMode: undefined,
  shortlistPayoutValue: undefined,
  hirePayoutMode: undefined,
  hirePayoutValue: undefined,
  maxSubmissions: 50,
  maxPerRecruiter: 5,
  openPositions: 1,
  jdS3Key: null,
  jdOriginalFilename: null,
  jdSizeBytes: null,
  jdMimeType: null,
};

export function toCreatePayload(values: RoleFormValues) {
  return {
    title: values.title,
    description: values.description,
    roleType: values.roleType,
    visibility: values.visibility,
    location: values.location,
    ...(values.country ? { country: values.country } : {}),
    isRemote: values.isRemote,
    employmentType: values.employmentType,
    experienceMin: values.experienceMin,
    experienceMax: values.experienceMax,
    skills: values.skillsCsv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    ctcMin: values.ctcMin,
    ctcMax: values.ctcMax,
    payoutType: values.payoutType,
    ...(values.shortlistPayoutMode ? { shortlistPayoutMode: values.shortlistPayoutMode } : {}),
    ...(values.shortlistPayoutValue ? { shortlistPayoutValue: values.shortlistPayoutValue } : {}),
    ...(values.hirePayoutMode ? { hirePayoutMode: values.hirePayoutMode } : {}),
    ...(values.hirePayoutValue ? { hirePayoutValue: values.hirePayoutValue } : {}),
    maxSubmissions: values.maxSubmissions,
    maxPerRecruiter: values.maxPerRecruiter,
    openPositions: values.openPositions,
    ...(values.jdS3Key
      ? {
          jdS3Key: values.jdS3Key,
          jdOriginalFilename: values.jdOriginalFilename ?? undefined,
          jdSizeBytes: values.jdSizeBytes ?? undefined,
          jdMimeType: values.jdMimeType ?? undefined,
        }
      : {}),
  };
}
