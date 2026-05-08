import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Connect4Settings } from "@/lib/connect4/types";

interface Connect4SettingsStore extends Connect4Settings {
  updateSetting: <K extends keyof Connect4Settings>(key: K, value: Connect4Settings[K]) => void;
  resetSettings: () => void;
}

const DEFAULT_CONNECT4_SETTINGS: Connect4Settings = {
  showLastMove: true,
  allowUndo: true,
  hintsEnabled: true,
  autoHintDelayMs: 30_000,
  animationSpeedMs: 60,
};

export const useConnect4Settings = create<Connect4SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CONNECT4_SETTINGS,
      updateSetting: <K extends keyof Connect4Settings>(key: K, value: Connect4Settings[K]) => {
        set({ [key]: value } as Partial<Connect4SettingsStore>);
      },
      resetSettings: () => set(DEFAULT_CONNECT4_SETTINGS),
    }),
    {
      name: "neon-arena:connect4-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
