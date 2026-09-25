import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Modal identifiers — extended as new modals are added.
 * Using a string union (rather than `string`) keeps consumers type-safe.
 */
export type ModalId =
  | 'confirm-logout'
  | 'bank-details-edit'
  | 'company-profile-edit'
  | 'recruiter-profile-edit';

interface UiState {
  sidebarOpen: boolean;
  activeModal: ModalId | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (id: ModalId) => void;
  closeModal: () => void;
}

/**
 * UI store
 * --------
 *  - Theme is now managed by next-themes (see main.tsx ThemeProvider).
 *  - Sidebar state is persisted. Modal state is ephemeral and resets on reload.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeModal: null,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'fastalent.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
      version: 1,
    },
  ),
);
