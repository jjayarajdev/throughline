import { z } from 'zod';

/** Body for POST /roles/:id/invite. */
export const CreateRoleInvitationSchema = z
  .object({
    recruiterProfileId: z.string().uuid('Invalid recruiter profile ID'),
    message: z
      .preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
        z.string().max(500, 'Message must be 500 characters or fewer').nullable().optional(),
      )
      .optional(),
  })
  .strict();

export type CreateRoleInvitationBody = z.infer<typeof CreateRoleInvitationSchema>;
