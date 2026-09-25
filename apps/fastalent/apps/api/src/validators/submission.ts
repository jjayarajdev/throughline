import { z } from 'zod';
import { SubmissionStatus } from '@gigcruite/types';
import { ALLOWED_CV_MIME, MAX_CV_SIZE_BYTES } from '../lib/file-validation.js';

/**
 * Submission validators — Phase 2 Wave 2.
 *
 * Cross-layer notes:
 *
 *   - `CvUploadIntentSchema` is the only piece the client sends to
 *     POST /upload/cv-intent. The server re-validates identical
 *     constants via `validateCvMetadata` inside `s3Service`.
 *
 *   - `CreateSubmissionSchema` intentionally accepts the candidate
 *     phone as a "raw-ish" string (8-20 chars). The server then
 *     runs it through `canonicalizePhone` in the service layer, which
 *     enforces a mandatory country code via libphonenumber-js. The
 *     400 from that helper carries the user-friendly message, so
 *     we don't try to duplicate the rule here.
 *
 *   - `coverNote` is nullable+optional with a preprocess that turns
 *     empty strings into `null`. This matches the Prisma `undefined =
 *     skip, null = clear` convention used across the service layer.
 *
 *   - Money caps mirror the 99,99,99,99.99 ceiling from the role
 *     validator (₹~1 cr).
 */

// --------------------------------------------------------------------
// Upload intent
// --------------------------------------------------------------------

export const CvUploadIntentSchema = z
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

export type CvUploadIntentBody = z.infer<typeof CvUploadIntentSchema>;

// --------------------------------------------------------------------
// Create submission
// --------------------------------------------------------------------

/** Empty strings in optional free-text fields get coerced to null. */
const nullableTrimmedString = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().min(1).max(max).nullable().optional(),
  );

export const CreateSubmissionSchema = z
  .object({
    roleId: z.string().uuid('Invalid role id'),

    candidateName: z
      .string()
      .trim()
      .min(2, 'Candidate name must be at least 2 characters')
      .max(255),
    candidateEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address')
      .max(255),
    // Phone is validated for length here; the service runs it through
    // `canonicalizePhone` to enforce E.164 + mandatory country code.
    candidatePhone: z
      .string()
      .trim()
      .min(8, 'Phone number is too short')
      .max(20, 'Phone number is too long'),

    s3Key: z
      .string()
      .min(10, 'Invalid upload reference')
      .max(500, 'Invalid upload reference'),
    cvOriginalFilename: z.string().trim().min(1).max(255),
    cvSizeBytes: z
      .number()
      .int()
      .positive()
      .max(MAX_CV_SIZE_BYTES),
    cvMimeType: z.enum(ALLOWED_CV_MIME, {
      errorMap: () => ({ message: 'Only PDF or DOCX files are accepted' }),
    }),

    coverNote: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z.string().trim().max(5000).nullable().optional(),
    ),

    expectedCtc: z
      .number({ invalid_type_error: 'Expected CTC must be a number' })
      .finite('Expected CTC must be finite')
      .nonnegative('Expected CTC cannot be negative')
      .max(99_99_99_99.99, 'Expected CTC is unrealistically large'),
    noticePeriodDays: z
      .number({ invalid_type_error: 'Notice period must be a number' })
      .int('Notice period must be a whole number of days')
      .min(0, 'Notice period cannot be negative')
      .max(365, 'Notice period must be 365 days or fewer'),

    currentLocation: nullableTrimmedString(255),
    currentCompany: nullableTrimmedString(255),

    // Phase 16: Optional AI match score (attached by frontend after pre-submit check)
    matchScore: z.number().int().min(0).max(100).optional(),
    matchBreakdown: z.object({
      skills: z.number().min(0).max(100),
      experience: z.number().min(0).max(100),
      qualifications: z.number().min(0).max(100),
    }).optional(),
    matchExplanation: z.string().max(5000).optional(),
  })
  .strict();

export type CreateSubmissionBody = z.infer<typeof CreateSubmissionSchema>;

// --------------------------------------------------------------------
// Status transition (Wave 4)
// --------------------------------------------------------------------

/** Empty strings → null for optional text fields. */
const emptyToNull = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? null : v;

// Phase 12: Structured rejection reasons for analytics
const REJECTION_REASONS = [
  'overqualified',
  'underqualified',
  'salary_mismatch',
  'cultural_fit',
  'experience_mismatch',
  'skills_gap',
  'accepted_elsewhere',
  'other',
] as const;

export const TransitionSubmissionSchema = z
  .object({
    toStatus: z.nativeEnum(SubmissionStatus),
    reason: z.preprocess(
      emptyToNull,
      z.string().trim().max(2000).nullable().optional(),
    ),
    rejectionReason: z.enum(REJECTION_REASONS).optional(),
    acceptedCtc: z
      .number({ invalid_type_error: 'Accepted CTC must be a number' })
      .positive('Accepted CTC must be positive')
      .max(99_99_99_99.99, 'Accepted CTC is unrealistically large')
      .optional(),
  })
  .strict()
  .refine(
    (d) => {
      if (d.toStatus === SubmissionStatus.HIRED) {
        return d.acceptedCtc !== undefined && d.acceptedCtc !== null;
      }
      return true;
    },
    {
      path: ['acceptedCtc'],
      message: 'acceptedCtc is required when transitioning to hired',
    },
  );

export type TransitionSubmissionBody = z.infer<typeof TransitionSubmissionSchema>;

// --------------------------------------------------------------------
// List schemas (Wave 3)
// --------------------------------------------------------------------

/** Shared offset-pagination shape for submission list endpoints. */
const paginationFields = {
  status: z.nativeEnum(SubmissionStatus).optional(),
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
} as const;

/** GET /api/submissions/me (recruiter's own submissions). */
export const ListRecruiterSubmissionsQuerySchema = z
  .object({
    roleId: z.string().uuid('Invalid role id').optional(),
    search: z.string().trim().max(100).optional(),
    ...paginationFields,
  })
  .strict();

/** GET /api/roles/:id/submissions (company-scoped). */
export const ListRoleSubmissionsQuerySchema = z
  .object(paginationFields)
  .strict();

export type ListRecruiterSubmissionsQuery = z.infer<typeof ListRecruiterSubmissionsQuerySchema>;
export type ListRoleSubmissionsQuery = z.infer<typeof ListRoleSubmissionsQuerySchema>;
