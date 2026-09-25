import { z } from 'zod';

export const ListEarningsQuerySchema = z
  .object({
    status: z
      .enum(['pending', 'payable', 'processing', 'paid', 'cancelled'])
      .optional(),
    earningType: z.enum(['shortlist_payout', 'hire_payout']).optional(),
    search: z.string().trim().max(100).optional(),
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

export type ListEarningsQuery = z.infer<typeof ListEarningsQuerySchema>;
