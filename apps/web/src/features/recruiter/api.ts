import type {
  RecruiterProfileResponse,
  UpdateRecruiterBankDetailsInput,
  UpdateRecruiterProfileInput,
} from '@gigcruite/types';
import { apiGet, apiPut } from '@/lib/api-client';

/**
 * Recruiter profile API surface — all requests go through the shared
 * apiClient and share the single-flight 401-refresh interceptor.
 *
 * Types come from `@gigcruite/types/profile` so the same shape is enforced
 * on both sides of the wire.
 */
export const recruiterApi = {
  getProfile: () => apiGet<RecruiterProfileResponse>('/recruiters/me'),

  updateProfile: (payload: UpdateRecruiterProfileInput) =>
    apiPut<RecruiterProfileResponse, UpdateRecruiterProfileInput>(
      '/recruiters/me',
      payload,
    ),

  updateBankDetails: (payload: UpdateRecruiterBankDetailsInput) =>
    apiPut<RecruiterProfileResponse, UpdateRecruiterBankDetailsInput>(
      '/recruiters/me/bank-details',
      payload,
    ),
};
