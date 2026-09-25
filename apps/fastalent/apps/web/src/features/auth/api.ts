import type {
  AuthUser,
  CompanySize,
  LoginResponse,
  RegisterResponse,
} from '@gigcruite/types';
import { apiGet, apiPost } from '@/lib/api-client';

/**
 * Auth API surface.
 *
 * All calls go through the shared `apiClient` so they benefit from:
 *   - Bearer-token injection from the Zustand auth store
 *   - Single-flight 401 refresh via the httpOnly refresh cookie
 *   - Envelope unwrapping (ApiSuccessResponse<T> → T)
 */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterRecruiterPayload {
  role: 'recruiter';
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  country?: string;
  currency?: string;
}

export interface RegisterCompanyPayload {
  role: 'company';
  email: string;
  password: string;
  companyName: string;
  industry?: string;
  companySize?: CompanySize;
  contactPerson?: string;
  contactPhone?: string;
  country?: string;
  currency?: string;
}

export type RegisterPayload = RegisterRecruiterPayload | RegisterCompanyPayload;

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

/** Slim country info returned by the public /countries endpoint (no auth). */
export interface PublicCountry {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string | null;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiPost<LoginResponse, LoginPayload>('/auth/login', payload),
  register: (payload: RegisterPayload) =>
    apiPost<RegisterResponse, RegisterPayload>('/auth/register', payload),
  logout: () => apiPost<{ success: true }>('/auth/logout', {}),
  me: () => apiGet<AuthUser>('/auth/me'),

  // --- Email verification + password reset ---
  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiPost<{ success: true }, ForgotPasswordPayload>(
      '/auth/forgot-password',
      payload,
    ),
  resetPassword: (payload: ResetPasswordPayload) =>
    apiPost<{ success: true }, ResetPasswordPayload>(
      '/auth/reset-password',
      payload,
    ),
  verifyEmail: (payload: VerifyEmailPayload) =>
    apiPost<{ success: true }, VerifyEmailPayload>(
      '/auth/verify-email',
      payload,
    ),

  // --- Public countries (no auth required) ---
  fetchPublicCountries: () =>
    apiGet<PublicCountry[]>('/countries'),

  // Dev-only: quick-login panel
  devUsers: () =>
    apiGet<DevUser[]>('/auth/dev-users'),
  devLogin: (userId: string) =>
    apiPost<LoginResponse, { userId: string }>('/auth/dev-login', { userId }),
};

export interface DevUser {
  id: string;
  email: string;
  role: string;
  status: string;
  name: string;
}
