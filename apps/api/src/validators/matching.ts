import { z } from 'zod';

export const MatchCheckBodySchema = z.object({
  cvS3Key: z.string().min(1),
  cvMimeType: z.string().min(1),
  candidateName: z.string().optional(),
  candidateEmail: z.string().email().optional(),
  candidatePhone: z.string().optional(),
}).strict();

export type MatchCheckBody = z.infer<typeof MatchCheckBodySchema>;

export const BiasAuditBodySchema = z.object({
  roleId: z.string().uuid(),
  cvS3Key: z.string().min(1),
  cvMimeType: z.string().min(1),
}).strict();

export type BiasAuditBody = z.infer<typeof BiasAuditBodySchema>;

export const RoleIdParamSchema = z.object({
  id: z.string().uuid(),
});
