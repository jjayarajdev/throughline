import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CreateRoleInput,
  JdUploadIntentInput,
  ListOwnerRolesFilters,
  ListPublicRolesFilters,
  UpdateRoleInput,
} from '@gigcruite/types';
import { invalidateByEvent } from '@/lib/cache-registry';
import { useAuthStore } from '@/stores/auth-store';
import { roleApi } from './api';

const MY_ROLES_KEY = (filters: ListOwnerRolesFilters) =>
  ['roles', 'me', filters] as const;
const ROLE_DETAIL_KEY = (id: string) => ['roles', 'detail', id] as const;
const ROLE_PUBLIC_KEY = (id: string) => ['roles', 'public', id] as const;

const BROWSE_ROLES_KEY = (filters: Omit<ListPublicRolesFilters, 'cursor'>) =>
  ['roles', 'public', 'browse', filters] as const;

export function useBrowseRoles(
  filters: Omit<ListPublicRolesFilters, 'cursor'> = {},
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useInfiniteQuery({
    queryKey: BROWSE_ROLES_KEY(filters),
    queryFn: ({ pageParam }) =>
      roleApi.listPublic({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated && (role === 'recruiter' || role === 'admin'),
    staleTime: 30_000,
  });
}

export function useMyRoles(filters: ListOwnerRolesFilters = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: MY_ROLES_KEY(filters),
    queryFn: () => roleApi.listMine(filters),
    enabled: isAuthenticated && role === 'company',
    staleTime: 30_000,
  });
}

export function useRole(id: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ROLE_DETAIL_KEY(id ?? ''),
    queryFn: () => roleApi.getById(id as string),
    enabled: isAuthenticated && Boolean(id),
    staleTime: 30_000,
  });
}

/**
 * Recruiter-facing public role detail. Unlike `useRole` this works
 * for any authenticated user but is scoped by the server to `active`
 * roles only. Used by the submission page (Wave 2) and — once it
 * lands — the recruiter browse list (Wave 3).
 */
export function useRolePublic(id: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ROLE_PUBLIC_KEY(id ?? ''),
    queryFn: () => roleApi.getPublic(id as string),
    enabled: isAuthenticated && Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoleInput) => roleApi.create(payload),
    onSuccess: () => {
      invalidateByEvent(qc, 'role.created');
    },
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRoleInput) => roleApi.update(id, payload),
    onSuccess: (data) => {
      qc.setQueryData(ROLE_DETAIL_KEY(id), data);
      invalidateByEvent(qc, 'role.updated');
    },
  });
}

function useStatusMutation(
  action: (id: string) => ReturnType<typeof roleApi.submit>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: (data: { id: string }) => {
      qc.setQueryData(ROLE_DETAIL_KEY(data.id), data);
      invalidateByEvent(qc, 'role.status-changed');
    },
  });
}

export function useSubmitRole() {
  return useStatusMutation(roleApi.submit);
}
/** @deprecated Use useSubmitRole — roles now go through admin review. */
export const usePublishRole = useSubmitRole;
export function usePauseRole() {
  return useStatusMutation(roleApi.pause);
}
export function useResumeRole() {
  return useStatusMutation(roleApi.resume);
}
export function useCloseRole() {
  return useStatusMutation(roleApi.close);
}

export function useCreateJdUploadIntent() {
  return useMutation({
    mutationFn: (payload: JdUploadIntentInput) =>
      roleApi.createJdUploadIntent(payload),
  });
}

export function useDownloadJd() {
  return useMutation({
    mutationFn: (roleId: string) => roleApi.downloadJd(roleId),
  });
}
