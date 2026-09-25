import { create } from "zustand";
import { persist } from "zustand/middleware";


interface hiringState {
  hrqid: string;
  hiringId: string;
  jobtitle: string;
  setHrqId: (code: string) => void;
  sethiringId: (id: string) => void;
  setJobTitle: (code: string) => void;
  clearHiringStore: () => void;
}

export const useHiringStore = create<hiringState>()(
  persist(
    (set) => ({
      hrqid: "",
      hiringId: "",
      jobtitle: "",
      setJobTitle: (code) => set({ jobtitle: code }),
      setHrqId: (code) => set({ hrqid: code }),
      sethiringId: (id) => set({ hiringId: id }),
      clearHiringStore: () => set({ hrqid: "" }),
    }),
    {
      name: "hiring-storage",
    }
  )
);
