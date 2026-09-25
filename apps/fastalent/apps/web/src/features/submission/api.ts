import axios from 'axios';
import type {
  CreateSubmissionInput,
  CvDownloadResponse,
  CvUploadIntentInput,
  CvUploadIntentResponse,
  ListRecruiterSubmissionsFilters,
  ListRoleSubmissionsFilters,
  SubmissionDetailResponse,
  SubmissionListItem,
  TransitionSubmissionInput,
} from '@gigcruite/types';
import { apiGet, apiPost } from '@/lib/api-client';

export interface ListSubmissionsResult {
  items: SubmissionListItem[];
  page: number;
  pageSize: number;
  total: number;
}

function buildSubmissionQuery(
  filters: ListRecruiterSubmissionsFilters | ListRoleSubmissionsFilters,
): string {
  const params = new URLSearchParams();
  if ('roleId' in filters && filters.roleId)
    params.set('roleId', filters.roleId);
  if ('search' in filters && filters.search)
    params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.pageSize !== undefined)
    params.set('pageSize', String(filters.pageSize));
  const q = params.toString();
  return q ? `?${q}` : '';
}

/**
 * Submission API — Phase 2 Wave 2.
 *
 * The upload path is a three-step dance:
 *
 *   1. `createUploadIntent` — POST /upload/cv-intent. Returns a
 *      pre-signed PUT URL bound to the declared filename/size/MIME.
 *   2. `uploadToS3` — raw axios PUT straight to S3. Bypasses our
 *      `apiClient` because (a) the URL is already signed and doesn't
 *      want our Bearer token and (b) S3 is cross-origin from our dev
 *      host, so sending credentials would trip CORS preflight.
 *   3. `create` — POST /submissions with the returned s3Key + form data.
 */

export const submissionApi = {
  createUploadIntent: (payload: CvUploadIntentInput) =>
    apiPost<CvUploadIntentResponse, CvUploadIntentInput>(
      '/upload/cv-intent',
      payload,
    ),

  /**
   * Direct S3 PUT with progress callback. The pre-signed URL encodes
   * `ContentType` and `ContentLength` — we MUST send a matching
   * `Content-Type` header or S3 rejects with 403.
   */
  uploadToS3: async (
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': contentType,
      },
      // axios adds a default Authorization sometimes via interceptors
      // on the global instance — we use bare `axios.put` to avoid that.
      withCredentials: false,
      onUploadProgress: (e) => {
        if (typeof e.total === 'number' && e.total > 0) {
          onProgress(e.loaded, e.total);
        } else {
          onProgress(e.loaded, file.size);
        }
      },
    });
  },

  create: (payload: CreateSubmissionInput) =>
    apiPost<SubmissionDetailResponse, CreateSubmissionInput>('/submissions', payload),

  getById: (id: string) =>
    apiGet<SubmissionDetailResponse>(`/submissions/${id}`),

  listMine: (filters: ListRecruiterSubmissionsFilters = {}) =>
    apiGet<ListSubmissionsResult>(
      `/submissions/me${buildSubmissionQuery(filters)}`,
    ),

  listForRole: (roleId: string, filters: ListRoleSubmissionsFilters = {}) =>
    apiGet<ListSubmissionsResult>(
      `/roles/${roleId}/submissions${buildSubmissionQuery(filters)}`,
    ),

  downloadCv: (submissionId: string) =>
    apiPost<CvDownloadResponse>(`/submissions/${submissionId}/download`),

  transitionStatus: (submissionId: string, payload: TransitionSubmissionInput) =>
    apiPost<SubmissionDetailResponse, TransitionSubmissionInput>(
      `/submissions/${submissionId}/status`,
      payload,
    ),
};
