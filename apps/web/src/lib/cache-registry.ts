import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Cache Invalidation Registry
 * ---------------------------
 * A single source of truth mapping domain events → query keys that must be
 * invalidated. Mutations emit events; the registry looks up the affected
 * query keys and invalidates them in one shot.
 *
 * WHY:
 *   - No more `queryClient.invalidateQueries(['users', 'me'])` sprinkled
 *     across dozens of mutation hooks.
 *   - When a new query is added that depends on event X, register it here
 *     once and every mutation that emits X automatically invalidates it.
 *   - Easy to audit: grep for an event name to find everything that
 *     refetches on it.
 *
 * HOW TO EXTEND:
 *   1. Add a new event name to the `AppEvent` union.
 *   2. Add its entry in `eventToQueryKeys`.
 *   3. In mutations, call `invalidateByEvent(qc, 'event.name')` on success.
 */

export type AppEvent =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password-changed'
  | 'auth.email-verified'
  | 'profile.updated'
  | 'recruiter.profile.updated'
  | 'recruiter.bank-details.updated'
  | 'company.profile.updated'
  | 'role.created'
  | 'role.updated'
  | 'role.status-changed'
  | 'submission.created'
  | 'submission.status-changed'
  | 'wallet.deposited'
  | 'wallet.updated'
  | 'earning.status-changed'
  | 'payout.requested'
  | 'payout.status-changed'
  | 'payout.approved'
  | 'payout.rejected'
  | 'payout.batch-run'
  | 'notification.read'
  | 'notification.read-all'
  | 'admin.setting-updated';

/**
 * Central map: event → list of query keys to invalidate.
 *
 * Query keys follow the TanStack Query convention of hierarchical arrays —
 * invalidating `['users']` will invalidate every key that begins with
 * `['users', ...]`.
 */
export const eventToQueryKeys: Record<AppEvent, QueryKey[]> = {
  'auth.login': [['users', 'me'], ['auth', 'session']],
  'auth.logout': [['users', 'me'], ['auth', 'session']],
  'auth.register': [['users', 'me']],
  'auth.password-changed': [['auth', 'session']],
  'auth.email-verified': [['users', 'me']],
  'profile.updated': [['users', 'me']],
  'recruiter.profile.updated': [['users', 'me'], ['recruiters', 'profile']],
  'recruiter.bank-details.updated': [['recruiters', 'profile']],
  'company.profile.updated': [['users', 'me'], ['companies', 'profile']],
  'role.created': [['roles', 'me']],
  'role.updated': [['roles', 'me'], ['roles', 'detail']],
  'role.status-changed': [['roles', 'me'], ['roles', 'detail']],
  // Creating a submission bumps the role's submissionsCount (which
  // in turn changes `slotsRemaining` on the public detail view) and
  // should land on the recruiter's "my submissions" list once Wave 3
  // wires the real query.
  'submission.created': [['submissions', 'me'], ['roles', 'public']],
  'submission.status-changed': [
    ['submissions', 'me'],
    ['submissions', 'detail'],
    ['submissions', 'role'],
    ['roles', 'me'],
  ],
  'wallet.deposited': [['wallet', 'balance'], ['wallet', 'transactions']],
  'wallet.updated': [['wallet', 'balance'], ['wallet', 'transactions']],
  'earning.status-changed': [['earnings', 'list'], ['earnings', 'summary'], ['wallet', 'balance']],
  'payout.requested': [['payouts', 'requests'], ['wallet', 'balance'], ['wallet', 'transactions']],
  'payout.status-changed': [['payouts', 'requests'], ['wallet', 'balance'], ['wallet', 'transactions']],
  'payout.approved': [['admin', 'payouts'], ['payouts', 'requests'], ['wallet', 'balance']],
  'payout.rejected': [['admin', 'payouts'], ['payouts', 'requests']],
  'payout.batch-run': [['admin', 'payouts'], ['payouts', 'requests'], ['wallet']],
  'notification.read': [['notifications', 'list'], ['notifications', 'unread-count']],
  'notification.read-all': [['notifications', 'list'], ['notifications', 'unread-count']],
  'admin.setting-updated': [['admin', 'settings']],
};

/**
 * Fire-and-forget invalidation for a domain event.
 * Can be called from anywhere with a QueryClient reference — including
 * outside the React tree (e.g. from axios interceptors, service workers).
 */
export function invalidateByEvent(qc: QueryClient, event: AppEvent): void {
  const keys = eventToQueryKeys[event];
  for (const key of keys) {
    // Fire-and-forget — invalidation is best-effort.
    void qc.invalidateQueries({ queryKey: key });
  }
}

/**
 * React hook wrapper for use inside components / mutation `onSuccess`.
 *
 *   const invalidate = useEventInvalidator();
 *   const mutation = useMutation({
 *     mutationFn: updateProfile,
 *     onSuccess: () => invalidate('profile.updated'),
 *   });
 */
export function useEventInvalidator(): (event: AppEvent) => void {
  const qc = useQueryClient();
  return (event: AppEvent) => invalidateByEvent(qc, event);
}
