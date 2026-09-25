import { z } from 'zod';

export const PayoutRequestSchema = z.object({
  amount: z.number().finite().positive('Amount must be greater than zero').max(10_00_000),
}).strict();

export const RejectPayoutSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(1000),
}).strict();

export const ListPayoutRequestsQuerySchema = z.object({
  status: z.enum(['pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  page: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(1).max(10_000).optional()).optional(),
  pageSize: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(1).max(100).optional()).optional(),
}).strict();

export const UpdateSettingSchema = z.object({
  value: z.string().trim().min(1, 'Value is required').max(500),
}).strict();

export type PayoutRequestBody = z.infer<typeof PayoutRequestSchema>;
export type RejectPayoutBody = z.infer<typeof RejectPayoutSchema>;
export type ListPayoutRequestsQuery = z.infer<typeof ListPayoutRequestsQuerySchema>;
export type UpdateSettingBody = z.infer<typeof UpdateSettingSchema>;
