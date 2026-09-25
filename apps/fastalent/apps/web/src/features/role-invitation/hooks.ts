import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRoleInvitationInput } from '@gigcruite/types';
import { useAuthStore } from '@/stores/auth-store';
import { roleInvitationApi } from './api';

const ROLE_INVITATIONS_KEY = (roleId: string) =>
  ['role-invitations', 'role', roleId] as const;
const MY_INVITATIONS_KEY = ['role-invitations', 'me'] as const;

export function useRoleInvitations(roleId: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ROLE_INVITATIONS_KEY(roleId ?? ''),
    queryFn: () => roleInvitationApi.listForRole(roleId as string),
    enabled: isAuthenticated && role === 'company' && Boolean(roleId),
    staleTime: 30_000,
  });
}

export function useMyInvitations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: MY_INVITATIONS_KEY,
    queryFn: () => roleInvitationApi.listMine(),
    enabled: isAuthenticated && role === 'recruiter',
    staleTime: 30_000,
  });
}

export function useInviteRecruiter(roleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoleInvitationInput) =>
      roleInvitationApi.invite(roleId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ROLE_INVITATIONS_KEY(roleId) });
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => roleInvitationApi.accept(invitationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MY_INVITATIONS_KEY });
      void qc.invalidateQueries({ queryKey: ['roles', 'public'] });
    },
  });
}

export function useDeclineInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => roleInvitationApi.decline(invitationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MY_INVITATIONS_KEY });
    },
  });
}

export function useSearchRecruiters(query: string) {
  return useQuery({
    queryKey: ['recruiters', 'search', query],
    queryFn: () => roleInvitationApi.searchRecruiters(query),
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });
}
