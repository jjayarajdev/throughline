import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateByEvent } from '@/lib/cache-registry';
import { useAuthStore } from '@/stores/auth-store';
import {
  authApi,
  type ForgotPasswordPayload,
  type LoginPayload,
  type PublicCountry,
  type RegisterPayload,
  type ResetPasswordPayload,
  type VerifyEmailPayload,
} from './api';

/**
 * useLogin
 * --------
 *  - Posts credentials to /auth/login.
 *  - On success, hydrates the Zustand auth store and emits `auth.login`
 *    through the cache-invalidation registry (invalidates ['users','me']
 *    and ['auth','session']).
 */
export function useLogin() {
  const qc = useQueryClient();
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      invalidateByEvent(qc, 'auth.login');
    },
  });
}

/**
 * useRegister — same shape as useLogin but hits /auth/register.
 */
export function useRegister() {
  const qc = useQueryClient();
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      invalidateByEvent(qc, 'auth.register');
    },
  });
}

/**
 * useLogout
 * ---------
 * Always clears local state even if the server call fails (e.g. network
 * blip, token already expired). This matches the UX expectation that
 * clicking "Log out" NEVER leaves the user in an ambiguous half-logged-in
 * state.
 */
export function useLogout() {
  const qc = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      invalidateByEvent(qc, 'auth.logout');
      qc.clear();
    },
  });
}

/**
 * useCurrentUser — /auth/me fetch, gated by isAuthenticated so an
 * unauthenticated tab doesn't spam the endpoint.
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * useForgotPassword — kicks off the server-side reset-link email. The
 * server returns `{ success: true }` unconditionally, so we cannot (and
 * must not) distinguish "email exists" from "email unknown" in the UI.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
  });
}

/**
 * useResetPassword — completes the reset flow with a token pulled from
 * the URL query. On success we emit `auth.password-changed` so any cached
 * session metadata is invalidated. The user is NOT automatically signed
 * in afterwards — they must log in with the new password (which also
 * verifies the password actually works before any session is opened).
 */
export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    onSuccess: () => {
      invalidateByEvent(qc, 'auth.password-changed');
    },
  });
}

/**
 * useVerifyEmail — consumes the token from the verification link. Emits
 * `auth.email-verified` so the cached /auth/me query refetches and picks
 * up the new `emailVerified: true` flag.
 */
export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) => authApi.verifyEmail(payload),
    onSuccess: () => {
      invalidateByEvent(qc, 'auth.email-verified');
    },
  });
}

/**
 * usePublicCountries — fetches active country configs from the public
 * /countries endpoint (no auth required). Used on registration pages.
 */
export function usePublicCountries() {
  return useQuery<PublicCountry[]>({
    queryKey: ['public', 'countries'],
    queryFn: () => authApi.fetchPublicCountries(),
    staleTime: 5 * 60_000,
  });
}
