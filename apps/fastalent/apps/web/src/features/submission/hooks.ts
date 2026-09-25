import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSubmissionInput,
  CvUploadIntentInput,
  ListRecruiterSubmissionsFilters,
  ListRoleSubmissionsFilters,
  TransitionSubmissionInput,
} from '@gigcruite/types';
import { invalidateByEvent } from '@/lib/cache-registry';
import { useAuthStore } from '@/stores/auth-store';
import { submissionApi } from './api';

const SUBMISSION_DETAIL_KEY = (id: string) =>
  ['submissions', 'detail', id] as const;
const MY_SUBMISSIONS_KEY = (filters: ListRecruiterSubmissionsFilters) =>
  ['submissions', 'me', filters] as const;
const ROLE_SUBMISSIONS_KEY = (roleId: string, filters: ListRoleSubmissionsFilters) =>
  ['submissions', 'role', roleId, filters] as const;

export function useCreateUploadIntent() {
  return useMutation({
    mutationFn: (payload: CvUploadIntentInput) =>
      submissionApi.createUploadIntent(payload),
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubmissionInput) =>
      submissionApi.create(payload),
    onSuccess: () => {
      invalidateByEvent(qc, 'submission.created');
    },
  });
}

export function useSubmission(id: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: SUBMISSION_DETAIL_KEY(id ?? ''),
    queryFn: () => submissionApi.getById(id as string),
    enabled: isAuthenticated && Boolean(id),
    staleTime: 30_000,
  });
}

export function useMySubmissions(filters: ListRecruiterSubmissionsFilters = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: MY_SUBMISSIONS_KEY(filters),
    queryFn: () => submissionApi.listMine(filters),
    enabled: isAuthenticated && role === 'recruiter',
    staleTime: 30_000,
  });
}

export function useMyRoleSubmissions(
  roleId: string | undefined,
  filters: ListRecruiterSubmissionsFilters = {},
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: MY_SUBMISSIONS_KEY({ ...filters, roleId }),
    queryFn: () => submissionApi.listMine({ ...filters, roleId }),
    enabled: isAuthenticated && role === 'recruiter' && Boolean(roleId),
    staleTime: 30_000,
  });
}

export function useRoleSubmissions(
  roleId: string | undefined,
  filters: ListRoleSubmissionsFilters = {},
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: ROLE_SUBMISSIONS_KEY(roleId ?? '', filters),
    queryFn: () => submissionApi.listForRole(roleId as string, filters),
    enabled: isAuthenticated && role === 'company' && Boolean(roleId),
    staleTime: 30_000,
  });
}

export function useDownloadCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) =>
      submissionApi.downloadCv(submissionId),
    onSuccess: () => {
      // Invalidate role submissions to pick up contactViewed change
      void qc.invalidateQueries({ queryKey: ['submissions', 'role'] });
    },
  });
}

export function useTransitionSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { submissionId: string; payload: TransitionSubmissionInput }) =>
      submissionApi.transitionStatus(vars.submissionId, vars.payload),
    onSuccess: () => {
      invalidateByEvent(qc, 'submission.status-changed');
    },
  });
}
