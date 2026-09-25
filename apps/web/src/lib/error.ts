import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@gigcruite/types';

/**
 * Pulls a user-facing error message out of any thrown value. Handles:
 *   - Our server's envelope (`{ success: false, error: { message } }`)
 *   - Plain AxiosError network failures
 *   - Native Error instances
 *   - Raw strings
 *
 * Always returns a non-empty string so callers can render it
 * unconditionally once they've checked `error != null`.
 */
export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (!err) return fallback;
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorResponse | undefined;
    if (body?.error?.message) return body.error.message;
    if (err.message) return err.message;
    return fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string') return err;
  return fallback;
}
