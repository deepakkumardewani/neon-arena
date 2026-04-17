import { create } from "zustand";

interface RootState {
  readonly ready: boolean;
  readonly setReady: (ready: boolean) => void;
}

export const useRootStore = create<RootState>((set) => ({
  ready: true,
  setReady: (ready) => set({ ready }),
}));
