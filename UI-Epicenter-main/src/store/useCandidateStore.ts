import { create } from "zustand";
import { persist } from "zustand/middleware";
interface candidateState {
    intakeId: number | null;
    setIntakeId: (code: number) => void;
}

export const useCandidateStore = create<candidateState>()(
    persist(
        (set) => ({
            intakeId: null,
            setIntakeId: (id) => set({ intakeId: id }),
        }),
        {
            name: "hiring-storage",
        }
    )
);
