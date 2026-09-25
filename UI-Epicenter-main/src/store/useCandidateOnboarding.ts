import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OnboardCandidateState = {
  hiringRequestId?: number | null;
  candidateId?: number | null;
  candidateRateCardId?:number | null;
  setOnboardCandidate: (data: { hiringRequestId?: number; candidateId?: number;candidateRateCardId?:number }) => void;
  clearOnboardCandidate: () => void;
};

export const useOnboardCandidateStore = create<OnboardCandidateState>()(
  persist(
    (set) => ({
      hiringRequestId: null,
      candidateId: null,
       candidateRateCardId:null,
      setOnboardCandidate: ({ hiringRequestId, candidateId,candidateRateCardId }) =>
        set({ hiringRequestId, candidateId, candidateRateCardId }),
      clearOnboardCandidate: () => set({ hiringRequestId: null, candidateId: null }),
    }),
    {
      name: 'onboard-candidate-storage',
    }
  )
);
