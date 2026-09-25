import type {
  CompanyProfileResponse,
  UpdateCompanyProfileInput,
} from '@gigcruite/types';
import { apiGet, apiPut } from '@/lib/api-client';

export const companyApi = {
  getProfile: () => apiGet<CompanyProfileResponse>('/companies/me'),

  updateProfile: (payload: UpdateCompanyProfileInput) =>
    apiPut<CompanyProfileResponse, UpdateCompanyProfileInput>(
      '/companies/me',
      payload,
    ),
};
