import { z } from 'zod';

const paginationFields = {
  page: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(10_000).optional(),
  ).optional(),
  pageSize: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().int().min(1).max(100).optional(),
  ).optional(),
};

export const ListUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.enum(['admin', 'recruiter', 'company']).optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'pending_verification']).optional(),
  ...paginationFields,
}).strict();

export const UpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked', 'pending_verification']),
}).strict();

export const ListRolesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(['draft', 'submitted', 'published', 'rejected', 'paused', 'closed', 'filled']).optional(),
  ...paginationFields,
}).strict();

export const ListEarningsQuerySchema = z.object({
  status: z.enum(['pending', 'payable', 'processing', 'paid', 'cancelled']).optional(),
  search: z.string().trim().max(200).optional(),
  ...paginationFields,
}).strict();

export const UpdateCompanyCommissionSchema = z.object({
  defaultCommissionPct: z
    .number({ invalid_type_error: 'Commission must be a number' })
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100%')
    .nullable(),
}).strict();

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type UpdateUserStatusBody = z.infer<typeof UpdateUserStatusSchema>;
export type ListRolesQuery = z.infer<typeof ListRolesQuerySchema>;
export type ListEarningsQuery = z.infer<typeof ListEarningsQuerySchema>;
export type UpdateCompanyCommissionBody = z.infer<typeof UpdateCompanyCommissionSchema>;
