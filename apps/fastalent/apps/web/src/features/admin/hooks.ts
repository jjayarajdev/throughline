import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import type { PayoutRequestResponse } from '@gigcruite/types';
import type { CountryConfigResponse, RoleAdminResponse } from '@gigcruite/types';
import {
  fetchAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  runPayoutBatch,
  fetchPayoutBatches,
  fetchAdminSettings,
  updateAdminSetting,
  fetchAdminMetrics,
  fetchAdminUsers,
  updateUserStatus,
  fetchAdminRoles,
  fetchAdminEarnings,
  approveRole,
  rejectRole,
  fetchCountryConfigs,
  createCountryConfig,
  updateCountryConfig,
  fetchAdminUserDetail,
  forcePasswordReset,
  updateCompanyCommission,
  fetchAdminRoleDetail,
  fetchRoleStatusHistory,
  type AdminPayoutFilters,
  type PaginatedAdminPayoutRequests,
  type PaginatedPayoutBatches,
  type PayoutBatch,
  type AdminSetting,
  type AdminMetrics,
  type AdminUserFilters,
  type PaginatedAdminUsers,
  type AdminUser,
  type AdminRoleFilters,
  type PaginatedAdminRoles,
  type AdminEarningFilters,
  type PaginatedAdminEarnings,
  type AdminUserDetail,
  type AdminRoleDetail,
  type RoleStatusHistoryEntry,
} from './api';

// ---- Payout request hooks ----

export function useAdminPayoutRequests(filters: AdminPayoutFilters) {
  return useQuery<PaginatedAdminPayoutRequests>({
    queryKey: ['admin', 'payouts', 'requests', filters],
    queryFn: () => fetchAllPayoutRequests(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useApprovePayoutRequest() {
  const qc = useQueryClient();
  return useMutation<PayoutRequestResponse, Error, string>({
    mutationFn: approvePayoutRequest,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      void qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRejectPayoutRequest() {
  const qc = useQueryClient();
  return useMutation<
    PayoutRequestResponse,
    Error,
    { id: string; reason: string }
  >({
    mutationFn: ({ id, reason }) => rejectPayoutRequest(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
  });
}

export function useRunPayoutBatch() {
  const qc = useQueryClient();
  return useMutation<PayoutBatch, Error, void>({
    mutationFn: runPayoutBatch,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
  });
}

// ---- Batch history hooks ----

export function usePayoutBatches(filters: { page?: number; pageSize?: number } = {}) {
  return useQuery<PaginatedPayoutBatches>({
    queryKey: ['admin', 'payouts', 'batches', filters],
    queryFn: () => fetchPayoutBatches(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ---- Admin settings hooks ----

export function useAdminSettings() {
  return useQuery<AdminSetting[]>({
    queryKey: ['admin', 'settings'],
    queryFn: fetchAdminSettings,
    staleTime: 60_000,
  });
}

export function useUpdateAdminSetting() {
  const qc = useQueryClient();
  return useMutation<AdminSetting, Error, { key: string; value: string }>({
    mutationFn: ({ key, value }) => updateAdminSetting(key, value),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}

// ---- Admin metrics ----

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ['admin', 'metrics'],
    queryFn: fetchAdminMetrics,
    staleTime: 30_000,
  });
}

// ---- Admin users ----

export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery<PaginatedAdminUsers>({
    queryKey: ['admin', 'users', filters],
    queryFn: () => fetchAdminUsers(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { userId: string; status: string }>({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
}

// ---- Admin roles ----

export function useAdminRoles(filters: AdminRoleFilters) {
  return useQuery<PaginatedAdminRoles>({
    queryKey: ['admin', 'roles', filters],
    queryFn: () => fetchAdminRoles(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

// ---- Role review ----

export function useApproveRole() {
  const qc = useQueryClient();
  return useMutation<RoleAdminResponse, Error, { roleId: string; platformCommissionPct?: number }>({
    mutationFn: ({ roleId, platformCommissionPct }) => approveRole(roleId, { platformCommissionPct }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      void qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useRejectRole() {
  const qc = useQueryClient();
  return useMutation<RoleAdminResponse, Error, { roleId: string; reason: string }>({
    mutationFn: ({ roleId, reason }) => rejectRole(roleId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      void qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

// ---- Country config ----

export function useCountryConfigs() {
  return useQuery<CountryConfigResponse[]>({
    queryKey: ['admin', 'countries'],
    queryFn: fetchCountryConfigs,
    staleTime: 60_000,
  });
}

export function useCreateCountryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCountryConfig,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'countries'] }); },
  });
}

export function useUpdateCountryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, input }: { code: string; input: Partial<CountryConfigResponse> }) =>
      updateCountryConfig(code, input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'countries'] }); },
  });
}

// ---- Admin earnings ----

export function useAdminEarnings(filters: AdminEarningFilters) {
  return useQuery<PaginatedAdminEarnings>({
    queryKey: ['admin', 'earnings', filters],
    queryFn: () => fetchAdminEarnings(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

// ---- Admin user detail ----

export function useAdminUserDetail(userId: string | undefined) {
  return useQuery<AdminUserDetail>({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => fetchAdminUserDetail(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useForcePasswordReset() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean; email: string }, Error, string>({
    mutationFn: forcePasswordReset,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateCompanyCommission() {
  const qc = useQueryClient();
  return useMutation<
    { id: string; companyName: string; defaultCommissionPct: string | null },
    Error,
    { companyId: string; defaultCommissionPct: number | null }
  >({
    mutationFn: ({ companyId, defaultCommissionPct }) =>
      updateCompanyCommission(companyId, defaultCommissionPct),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ---- Admin role detail ----

export function useAdminRoleDetail(roleId: string | undefined) {
  return useQuery<AdminRoleDetail>({
    queryKey: ['admin', 'roles', 'detail', roleId],
    queryFn: () => fetchAdminRoleDetail(roleId!),
    enabled: !!roleId,
    staleTime: 15_000,
  });
}

export function useRoleStatusHistory(roleId: string | undefined) {
  return useQuery<RoleStatusHistoryEntry[]>({
    queryKey: ['admin', 'roles', 'history', roleId],
    queryFn: () => fetchRoleStatusHistory(roleId!),
    enabled: !!roleId,
    staleTime: 30_000,
  });
}
