import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard
 * ---------
 * Redirects unauthenticated callers to `/login` and preserves the
 * originally requested location in `location.state.from` so the login
 * page can bounce the user back after a successful sign-in.
 *
 * Pair this with `replace` on the Navigate so an unauth visit to `/app`
 * doesn't litter the browser back stack with a redirect entry.
 */
export function AuthGuard({ children }: AuthGuardProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
