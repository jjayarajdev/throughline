import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@gigcruite/types';

/**
 * Auth store
 * ----------
 *  - Persists `user` + `isAuthenticated` to localStorage so a page reload
 *    keeps the shell rendered while the refresh flow re-hydrates the access
 *    token.
 *  - Does NOT persist `accessToken`: it lives only in memory (15-min expiry),
 *    which keeps localStorage free of credentials and matches the httpOnly
 *    refresh-cookie model. The axios interceptor silently refreshes on 401.
 */
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  login: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'gigcruite.auth',
      storage: createJSONStorage(() => localStorage),
      // Deliberately omit accessToken from persistence.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
    },
  ),
);
