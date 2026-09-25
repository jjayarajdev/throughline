import type {
  CreateRoleInput,
  CursorPaginatedData,
  JdDownloadResponse,
  JdUploadIntentInput,
  JdUploadIntentResponse,
  ListOwnerRolesFilters,
  ListPublicRolesFilters,
  RoleOwnerResponse,
  RolePublicResponse,
  UpdateRoleInput,
} from '@gigcruite/types';
import { apiGet, apiPatch, apiPost } from '@/lib/api-client';

export interface ListOwnerRolesResult {
  items: RoleOwnerResponse[];
  page: number;
  pageSize: number;
  total: number;
}

function buildQuery(filters: ListOwnerRolesFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.pageSize !== undefined)
    params.set('pageSize', String(filters.pageSize));
  const q = params.toString();
  return q ? `?${q}` : '';
}

function buildPublicQuery(filters: ListPublicRolesFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.roleType) params.set('roleType', filters.roleType);
  if (filters.skills && filters.skills.length > 0)
    params.set('skills', filters.skills.join(','));
  if (filters.minCtc !== undefined) params.set('minCtc', String(filters.minCtc));
  if (filters.maxCtc !== undefined) params.set('maxCtc', String(filters.maxCtc));
  if (filters.isRemote !== undefined)
    params.set('isRemote', String(filters.isRemote));
  if (filters.employmentType) params.set('employmentType', filters.employmentType);
  if (filters.status) params.set('status', filters.status);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.pageSize !== undefined)
    params.set('pageSize', String(filters.pageSize));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const roleApi = {
  create: (payload: CreateRoleInput) =>
    apiPost<RoleOwnerResponse, CreateRoleInput>('/roles', payload),

  listMine: (filters: ListOwnerRolesFilters = {}) =>
    apiGet<ListOwnerRolesResult>(`/roles/me${buildQuery(filters)}`),

  getById: (id: string) => apiGet<RoleOwnerResponse>(`/roles/${id}`),

  /**
   * Recruiter-facing public detail view. Returns 404 for any role
   * that is not currently `active` — the server deliberately hides
   * non-active roles from recruiters.
   */
  getPublic: (id: string) =>
    apiGet<RolePublicResponse>(`/roles/${id}/public`),

  update: (id: string, payload: UpdateRoleInput) =>
    apiPatch<RoleOwnerResponse, UpdateRoleInput>(`/roles/${id}`, payload),

  submit: (id: string) =>
    apiPost<RoleOwnerResponse>(`/roles/${id}/submit`),

  pause: (id: string) => apiPost<RoleOwnerResponse>(`/roles/${id}/pause`),

  resume: (id: string) => apiPost<RoleOwnerResponse>(`/roles/${id}/resume`),

  close: (id: string) => apiPost<RoleOwnerResponse>(`/roles/${id}/close`),

  listPublic: (filters: ListPublicRolesFilters = {}) =>
    apiGet<CursorPaginatedData<RolePublicResponse>>(
      `/roles${buildPublicQuery(filters)}`,
    ),

  createJdUploadIntent: (payload: JdUploadIntentInput) =>
    apiPost<JdUploadIntentResponse, JdUploadIntentInput>(
      '/upload/jd-intent',
      payload,
    ),

  downloadJd: (roleId: string) =>
    apiPost<JdDownloadResponse>(`/roles/${roleId}/jd-download`),
};
