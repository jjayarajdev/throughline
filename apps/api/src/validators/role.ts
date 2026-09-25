import { z } from 'zod';
import { RoleType, RoleStatus, PayoutType, PayoutMode, RoleVisibility, EMPLOYMENT_TYPES } from '@gigcruite/types';
import { ALLOWED_CV_MIME, MAX_CV_SIZE_BYTES } from '../lib/file-validation.js';

/**
 * Role validators — Phase 11/12 overhaul.
 *
 * Changes from Phase 2:
 *   - payoutPerShortlist/payoutPerHire → shortlistPayoutMode/Value + hirePayoutMode/Value
 *   - country field added (2-char ISO 3166-1 alpha-2)
 *   - platformCommissionPct removed from company-facing input (admin-only, resolved at approve)
 *   - Cross-field: mode+value required per payoutType
 */

/** Currency amount. Server converts to Prisma.Decimal at the boundary. */
const moneyAmount = (label: string) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .finite(`${label} must be finite`)
    .nonnegative(`${label} cannot be negative`)
    .max(99_99_99_99.99, `${label} is unrealistically large`);

const experienceYears = (label: string) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number of years`)
    .min(0, `${label} cannot be negative`)
    .max(50, `${label} is unrealistically large`);

const baseFields = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  description: z
    .string()
    .trim()
    .min(30, 'Description must be at least 30 characters')
    .max(10_000),
  roleType: z.nativeEnum(RoleType),
  visibility: z.nativeEnum(RoleVisibility).optional(),

  country: z.string().trim().length(2, 'Country code must be 2 characters').toUpperCase().optional(),

  location: z.string().trim().min(2, 'Location is required').max(255),
  isRemote: z.boolean(),
  employmentType: z.enum(EMPLOYMENT_TYPES, {
    errorMap: () => ({ message: 'Invalid employment type' }),
  }),

  experienceMin: experienceYears('Minimum experience'),
  experienceMax: experienceYears('Maximum experience'),

  skills: z
    .array(z.string().trim().min(1).max(50))
    .max(25, 'At most 25 skills per role'),

  ctcMin: moneyAmount('Minimum CTC'),
  ctcMax: moneyAmount('Maximum CTC'),

  payoutType: z.nativeEnum(PayoutType),

  shortlistPayoutMode: z.nativeEnum(PayoutMode).optional(),
  shortlistPayoutValue: z
    .number({ invalid_type_error: 'Shortlist payout value must be a number' })
    .finite()
    .positive('Shortlist payout value must be greater than zero')
    .optional(),
  hirePayoutMode: z.nativeEnum(PayoutMode).optional(),
  hirePayoutValue: z
    .number({ invalid_type_error: 'Hire payout value must be a number' })
    .finite()
    .positive('Hire payout value must be greater than zero')
    .optional(),

  maxSubmissions: z
    .number()
    .int('Max submissions must be a whole number')
    .min(1, 'Max submissions must be at least 1')
    .max(500, 'Max submissions must be 500 or fewer')
    .optional(),
  maxPerRecruiter: z
    .number()
    .int('Max per recruiter must be a whole number')
    .min(1, 'Max per recruiter must be at least 1')
    .max(100, 'Max per recruiter must be 100 or fewer')
    .optional(),
  openPositions: z
    .number()
    .int('Open positions must be a whole number')
    .min(1, 'Open positions must be at least 1')
    .max(100, 'Open positions must be 100 or fewer')
    .optional(),

  // JD fields — set after a successful upload via POST /upload/jd-intent.
  jdS3Key: z.string().min(10).max(500).optional(),
  jdOriginalFilename: z.string().trim().min(1).max(255).optional(),
  jdSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_CV_SIZE_BYTES)
    .optional(),
  jdMimeType: z
    .enum(ALLOWED_CV_MIME, {
      errorMap: () => ({ message: 'Only PDF or DOCX files are accepted for JD' }),
    })
    .optional(),
} as const;

type CrossFields = {
  payoutType?: PayoutType;
  shortlistPayoutMode?: PayoutMode;
  shortlistPayoutValue?: number;
  hirePayoutMode?: PayoutMode;
  hirePayoutValue?: number;
  ctcMin?: number;
  ctcMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  maxSubmissions?: number;
  maxPerRecruiter?: number;
};

function validateCrossFields(d: CrossFields, ctx: z.RefinementCtx): void {
  // CTC band
  if (
    typeof d.ctcMin === 'number' &&
    typeof d.ctcMax === 'number' &&
    d.ctcMax < d.ctcMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ctcMax'],
      message: 'Maximum CTC must be greater than or equal to minimum CTC',
    });
  }

  // Experience band
  if (
    typeof d.experienceMin === 'number' &&
    typeof d.experienceMax === 'number' &&
    d.experienceMax < d.experienceMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['experienceMax'],
      message:
        'Maximum experience must be greater than or equal to minimum experience',
    });
  }

  // Submission caps
  if (
    typeof d.maxSubmissions === 'number' &&
    typeof d.maxPerRecruiter === 'number' &&
    d.maxSubmissions < d.maxPerRecruiter
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maxSubmissions'],
      message: 'Max submissions must be greater than or equal to max per recruiter',
    });
  }

  // Payout mode+value requirements based on payoutType
  if (d.payoutType !== undefined) {
    const needsShortlist =
      d.payoutType === PayoutType.PER_SHORTLIST || d.payoutType === PayoutType.HYBRID;
    const needsHire =
      d.payoutType === PayoutType.PER_HIRE || d.payoutType === PayoutType.HYBRID;

    if (needsShortlist) {
      if (!d.shortlistPayoutMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shortlistPayoutMode'],
          message: 'Shortlist payout mode is required for this payout type',
        });
      }
      if (d.shortlistPayoutValue === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shortlistPayoutValue'],
          message: 'Shortlist payout value is required for this payout type',
        });
      }
      // Percentage range guard
      if (d.shortlistPayoutMode === PayoutMode.PERCENTAGE && d.shortlistPayoutValue !== undefined) {
        if (d.shortlistPayoutValue > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['shortlistPayoutValue'],
            message: 'Percentage cannot exceed 100%',
          });
        }
      }
    }

    if (needsHire) {
      if (!d.hirePayoutMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hirePayoutMode'],
          message: 'Hire payout mode is required for this payout type',
        });
      }
      if (d.hirePayoutValue === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hirePayoutValue'],
          message: 'Hire payout value is required for this payout type',
        });
      }
      if (d.hirePayoutMode === PayoutMode.PERCENTAGE && d.hirePayoutValue !== undefined) {
        if (d.hirePayoutValue > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['hirePayoutValue'],
            message: 'Percentage cannot exceed 100%',
          });
        }
      }
    }
  }
}

export const CreateRoleSchema = z
  .object(baseFields)
  .strict()
  .superRefine((data, ctx) => validateCrossFields(data, ctx));

export const UpdateRoleSchema = z
  .object(baseFields)
  .partial()
  .strict()
  .superRefine((data, ctx) => validateCrossFields(data, ctx));

/** Admin approve/reject body. */
export const AdminRoleActionSchema = z
  .object({
    comment: z.string().trim().max(2000).optional(),
    platformCommissionPct: z
      .number({ invalid_type_error: 'Commission must be a number' })
      .min(0, 'Commission cannot be negative')
      .max(100, 'Commission cannot exceed 100%')
      .optional(),
  })
  .strict();

export const AdminRejectRoleSchema = z
  .object({
    comment: z.string().trim().min(5, 'Rejection reason must be at least 5 characters').max(2000),
  })
  .strict();

/** Query filters for GET /api/roles/me (company's own list). */
export const ListOwnerRolesQuerySchema = z
  .object({
    status: z.nativeEnum(RoleStatus).optional(),
    search: z.string().trim().max(255).optional(),
    page: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().int().min(1).max(10_000).optional(),
      )
      .optional(),
    pageSize: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().int().min(1).max(100).optional(),
      )
      .optional(),
  })
  .strict();

/** Query filters for GET /api/roles (public recruiter browsing). */
export const ListPublicRolesQuerySchema = z
  .object({
    search: z.string().trim().max(255).optional(),
    roleType: z.nativeEnum(RoleType).optional(),
    status: z.nativeEnum(RoleStatus).optional(),
    skills: z
      .preprocess(
        (v) =>
          typeof v === 'string'
            ? v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : v,
        z.array(z.string().trim().min(1).max(50)).max(25).optional(),
      )
      .optional(),
    minCtc: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().finite().nonnegative().optional(),
      )
      .optional(),
    maxCtc: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().finite().nonnegative().optional(),
      )
      .optional(),
    isRemote: z
      .preprocess(
        (v) =>
          v === 'true' ? true : v === 'false' ? false : v === '' ? undefined : v,
        z.boolean().optional(),
      )
      .optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    cursor: z.string().max(500).optional(),
    pageSize: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().int().min(1).max(50).optional(),
      )
      .optional(),
  })
  .strict();

/** JD upload intent — same shape as CvUploadIntentSchema but in role validators. */
export const JdUploadIntentSchema = z
  .object({
    filename: z
      .string()
      .trim()
      .min(1, 'Filename is required')
      .max(255, 'Filename must be 255 characters or fewer'),
    sizeBytes: z
      .number({ invalid_type_error: 'File size must be a number' })
      .int('File size must be a whole number')
      .positive('File size must be positive')
      .max(
        MAX_CV_SIZE_BYTES,
        `File size must be ${MAX_CV_SIZE_BYTES / 1_048_576} MB or smaller`,
      ),
    mimeType: z.enum(ALLOWED_CV_MIME, {
      errorMap: () => ({ message: 'Only PDF or DOCX files are accepted' }),
    }),
  })
  .strict();

export type JdUploadIntentBody = z.infer<typeof JdUploadIntentSchema>;

export type CreateRoleBody = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleBody = z.infer<typeof UpdateRoleSchema>;
export type ListOwnerRolesQuery = z.infer<typeof ListOwnerRolesQuerySchema>;
export type ListPublicRolesQuery = z.infer<typeof ListPublicRolesQuerySchema>;
