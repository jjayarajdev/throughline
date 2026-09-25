import type { CountryConfigResponse, PayoutRequestResponse, RoleAdminResponse } from '@gigcruite/types';
import { apiGet, apiPost, apiPut, apiPatch } from '@/lib/api-client';

// ---- Types ----

export interface AdminPayoutFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAdminPayoutRequests {
  requests: PayoutRequestResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PayoutBatch {
  id: string;
  status: string;
  totalAmount: string;
  requestCount: number;
  processedAt: string | null;
  createdAt: string;
}

export interface PaginatedPayoutBatches {
  batches: PayoutBatch[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminSetting {
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

// ---- API functions ----

export function fetchAllPayoutRequests(
  filters: AdminPayoutFilters,
): Promise<PaginatedAdminPayoutRequests> {
  return apiGet<PaginatedAdminPayoutRequests>('/payouts/requests', {
    params: filters,
  });
}

export function approvePayoutRequest(id: string): Promise<PayoutRequestResponse> {
  return apiPost<PayoutRequestResponse>(`/payouts/requests/${id}/approve`);
}

export function rejectPayoutRequest(
  id: string,
  reason: string,
): Promise<PayoutRequestResponse> {
  return apiPost<PayoutRequestResponse>(`/payouts/requests/${id}/reject`, { reason });
}

export function runPayoutBatch(): Promise<PayoutBatch> {
  return apiPost<PayoutBatch>('/payouts/batch/run');
}

export function fetchPayoutBatches(
  filters: { page?: number; pageSize?: number } = {},
): Promise<PaginatedPayoutBatches> {
  return apiGet<PaginatedPayoutBatches>('/payouts/batches', { params: filters });
}

export function fetchAdminSettings(): Promise<AdminSetting[]> {
  return apiGet<AdminSetting[]>('/admin/settings');
}

export function updateAdminSetting(
  key: string,
  value: string,
): Promise<AdminSetting> {
  return apiPut<AdminSetting>(`/admin/settings/${key}`, { value });
}

// ---- Admin Metrics ----

export interface AdminMetrics {
  totalCompanies: number;
  totalRecruiters: number;
  totalRoles: number;
  activeRoles: number;
  totalSubmissions: number;
  totalEarnings: string;
  totalPlatformCommission: string;
  totalPayouts: string;
}

export function fetchAdminMetrics(): Promise<AdminMetrics> {
  return apiGet<AdminMetrics>('/admin/metrics');
}

// ---- Admin Users ----

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  recruiterProfile: { fullName: string; phone: string | null; reputationTier: string; totalPlacements: number } | null;
  companyProfile: { companyName: string; industry: string | null; companySize: string | null } | null;
}

export interface PaginatedAdminUsers {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchAdminUsers(filters: AdminUserFilters): Promise<PaginatedAdminUsers> {
  return apiGet<PaginatedAdminUsers>('/admin/users', { params: filters });
}

export function updateUserStatus(userId: string, status: string): Promise<AdminUser> {
  return apiPatch<AdminUser>(`/admin/users/${userId}/status`, { status });
}

// ---- Admin Roles ----

export interface AdminRoleFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminRole {
  id: string;
  title: string;
  status: string;
  roleType: string;
  location: string;
  ctcMin: string;
  ctcMax: string;
  submissionsCount: number;
  shortlistedCount: number;
  hiredCount: number;
  createdAt: string;
  company: { companyName: string };
}

export interface PaginatedAdminRoles {
  roles: AdminRole[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchAdminRoles(filters: AdminRoleFilters): Promise<PaginatedAdminRoles> {
  return apiGet<PaginatedAdminRoles>('/admin/roles', { params: filters });
}

// ---- Admin Earnings ----

export interface AdminEarningFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminEarning {
  id: string;
  earningType: string;
  status: string;
  grossAmount: string;
  platformCommission: string;
  platformCommissionPct: string;
  netAmount: string;
  createdAt: string;
  recruiter: { fullName: string };
  role: { title: string; company: { companyName: string } };
}

export interface PaginatedAdminEarnings {
  earnings: AdminEarning[];
  total: number;
  page: number;
  pageSize: number;
  totals: {
    grossAmount: string;
    platformCommission: string;
    netAmount: string;
  };
}

export function fetchAdminEarnings(filters: AdminEarningFilters): Promise<PaginatedAdminEarnings> {
  return apiGet<PaginatedAdminEarnings>('/admin/earnings', { params: filters });
}

// ---- Role review (admin approve/reject) ----

export function approveRole(roleId: string, body?: { platformCommissionPct?: number }): Promise<RoleAdminResponse> {
  return apiPost<RoleAdminResponse>(`/roles/${roleId}/approve`, body ?? {});
}

export function rejectRole(roleId: string, reason: string): Promise<RoleAdminResponse> {
  return apiPost<RoleAdminResponse>(`/roles/${roleId}/reject`, { reason });
}

// ---- Admin User Detail ----

export interface AdminUserDetail {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  companyProfile: {
    id: string;
    companyName: string;
    industry: string | null;
    companySize: string | null;
    headquarters: string | null;
    country: string;
    currency: string;
    defaultCommissionPct: string | null;
    wallet: {
      balance: string;
      lockedBalance: string;
    } | null;
  } | null;
  recruiterProfile: {
    id: string;
    fullName: string;
    phone: string | null;
    specializations: string[];
    yearsOfExperience: number | null;
    reputationTier: string;
    totalPlacements: number;
    country: string;
    currency: string;
    walletBalance: string;
  } | null;
  recentRoles: { id: string; title: string; status: string; createdAt: string }[];
  recentSubmissionsCount: number;
}

export function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return apiGet<AdminUserDetail>(`/admin/users/${userId}`);
}

export function forcePasswordReset(userId: string): Promise<{ success: boolean; email: string }> {
  return apiPost<{ success: boolean; email: string }>(`/admin/users/${userId}/reset-password`);
}

export function updateCompanyCommission(
  companyId: string,
  defaultCommissionPct: number | null,
): Promise<{ id: string; companyName: string; defaultCommissionPct: string | null }> {
  return apiPatch<{ id: string; companyName: string; defaultCommissionPct: string | null }>(
    `/admin/companies/${companyId}/commission`,
    { defaultCommissionPct },
  );
}

// ---- Role detail (admin) ----

export interface AdminRoleDetail {
  id: string;
  companyId: string;
  title: string;
  description: string;
  roleType: string;
  status: string;
  visibility: string;
  country: string;
  currency: string;
  location: string;
  isRemote: boolean;
  employmentType: string;
  experienceMin: number;
  experienceMax: number;
  skills: string[];
  ctcMin: string;
  ctcMax: string;
  payoutType: string;
  shortlistPayoutMode: string | null;
  shortlistPayoutValue: string | null;
  hirePayoutMode: string | null;
  hirePayoutValue: string | null;
  platformCommissionPct: string | null;
  vendorBenchmarkPct: string | null;
  maxSubmissions: number;
  maxPerRecruiter: number;
  openPositions: number;
  submissionsCount: number;
  shortlistedCount: number;
  hiredCount: number;
  jdOriginalFilename: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function fetchAdminRoleDetail(roleId: string): Promise<AdminRoleDetail> {
  return apiGet<AdminRoleDetail>(`/roles/${roleId}`);
}

export interface RoleStatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedByEmail?: string;
  comment: string | null;
  createdAt: string;
}

export function fetchRoleStatusHistory(roleId: string): Promise<RoleStatusHistoryEntry[]> {
  return apiGet<RoleStatusHistoryEntry[]>(`/roles/${roleId}/status-history`);
}

// ---- Country config ----

export function fetchCountryConfigs(): Promise<CountryConfigResponse[]> {
  return apiGet<CountryConfigResponse[]>('/admin/countries');
}

export function fetchActiveCountryConfigs(): Promise<CountryConfigResponse[]> {
  return apiGet<CountryConfigResponse[]>('/admin/countries/active');
}

export function createCountryConfig(input: Omit<CountryConfigResponse, 'id'>): Promise<CountryConfigResponse> {
  return apiPost<CountryConfigResponse>('/admin/countries', input);
}

export function updateCountryConfig(code: string, input: Partial<CountryConfigResponse>): Promise<CountryConfigResponse> {
  return apiPut<CountryConfigResponse>(`/admin/countries/${code}`, input);
}
