import { create } from "zustand";

interface AudioShellState {
  readonly bootstrapped: boolean;
}

export const useAudioStore = create<AudioShellState>(() => ({
  bootstrapped: false,
}));
