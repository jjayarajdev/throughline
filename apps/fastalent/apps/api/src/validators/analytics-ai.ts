import { z } from 'zod';

// ---- Anomaly List ----

export const AnomalyListQuerySchema = z
  .object({
    type: z.enum(['stale_role', 'declining_activity', 'high_rejection_rate']).optional(),
    status: z.enum(['active', 'acknowledged', 'resolved', 'expired']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export type AnomalyListQuery = z.infer<typeof AnomalyListQuerySchema>;

// ---- Anomaly Action ----

export const AnomalyActionParamSchema = z.object({
  id: z.string().uuid(),
});

// ---- AI Usage Stats ----

export const AiUsageQuerySchema = z
  .object({
    startDate: z
      .preprocess(
        (v) => (typeof v === 'string' && v.trim() !== '' ? v : undefined),
        z.string().datetime({ offset: true }).or(z.string().date()).optional(),
      )
      .optional(),
    endDate: z
      .preprocess(
        (v) => (typeof v === 'string' && v.trim() !== '' ? v : undefined),
        z.string().datetime({ offset: true }).or(z.string().date()).optional(),
      )
      .optional(),
  })
  .strict();

export type AiUsageQuery = z.infer<typeof AiUsageQuerySchema>;
