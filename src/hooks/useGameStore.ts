import { create } from "zustand";

/** Expanded in Phase 2 — placeholder so routes can import the module graph early. */
interface GameShellState {
  readonly bootstrapped: boolean;
}

export const useGameStore = create<GameShellState>(() => ({
  bootstrapped: false,
}));
