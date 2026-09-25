import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton TanStack Query client.
 *
 * Defaults chosen for the fastalent SaaS workload:
 *   - staleTime 30s   → fresh data feels fresh, avoids refetch spam on remount
 *   - gcTime  5 min   → unmounted data stays around for quick back-nav
 *   - retry   1       → transient network blip recovers, but we don't mask bugs
 *   - refetchOnWindowFocus false → prevents noisy refetches during dev
 *
 * Server mutations should invalidate via the Cache Invalidation Registry
 * (see `./cache-registry.ts`) — never call `invalidateQueries` with string
 * literals scattered across the codebase.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
