import type { RoleInvitationResponse, CreateRoleInvitationInput } from '@gigcruite/types';
import { apiGet, apiPost } from '@/lib/api-client';

export const roleInvitationApi = {
  /** Company: invite a recruiter to a role. */
  invite: (roleId: string, payload: CreateRoleInvitationInput) =>
    apiPost<RoleInvitationResponse, CreateRoleInvitationInput>(
      `/roles/${roleId}/invite`,
      payload,
    ),

  /** Company: list invitations for a role. */
  listForRole: (roleId: string) =>
    apiGet<RoleInvitationResponse[]>(`/roles/${roleId}/invitations`),

  /** Company: search recruiters by name. */
  searchRecruiters: (q: string) =>
    apiGet<Array<{
      id: string;
      fullName: string;
      specializations: string[];
      reputationTier: string;
      reputationScore: number;
    }>>(`/recruiters/search?q=${encodeURIComponent(q)}`),

  /** Recruiter: list my invitations. */
  listMine: () =>
    apiGet<RoleInvitationResponse[]>('/invitations/me'),

  /** Recruiter: accept invitation. */
  accept: (invitationId: string) =>
    apiPost<RoleInvitationResponse>(`/invitations/${invitationId}/accept`),

  /** Recruiter: decline invitation. */
  decline: (invitationId: string) =>
    apiPost<RoleInvitationResponse>(`/invitations/${invitationId}/decline`),
};
