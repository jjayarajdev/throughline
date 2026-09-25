import { z } from 'zod';

/** Query filters for GET /notifications. */
export const ListNotificationsQuerySchema = z
  .object({
    isRead: z
      .preprocess(
        (v) =>
          v === 'true' ? true : v === 'false' ? false : v === '' ? undefined : v,
        z.boolean().optional(),
      )
      .optional(),
    cursor: z.string().max(500).optional(),
    pageSize: z
      .preprocess(
        (v) => (v === '' || v === undefined ? undefined : Number(v)),
        z.number().int().min(1).max(50).optional(),
      )
      .optional(),
  })
  .strict();

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;
