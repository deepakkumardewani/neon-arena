import { create } from "zustand";

interface PlayerShellState {
  readonly bootstrapped: boolean;
}

export const usePlayerStore = create<PlayerShellState>(() => ({
  bootstrapped: false,
}));
