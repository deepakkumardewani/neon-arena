import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { DotsSettings } from "../types";

interface DotsSettingsStore extends DotsSettings {
  updateSetting: <K extends keyof DotsSettings>(key: K, value: DotsSettings[K]) => void;
  resetSettings: () => void;
}

const DEFAULT_DOTS_SETTINGS: DotsSettings = {
  defaultSize: { rows: 5, cols: 5 },
  showLastMove: true,
  allowUndo: true,
  hintsEnabled: true,
  autoHintDelayMs: 30_000,
  animationSpeedMs: 60,
};

export const useDotsSettings = create<DotsSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_DOTS_SETTINGS,
      updateSetting: <K extends keyof DotsSettings>(key: K, value: DotsSettings[K]) => {
        set({ [key]: value } as Partial<DotsSettingsStore>);
      },
      resetSettings: () => set(DEFAULT_DOTS_SETTINGS),
    }),
    {
      name: "neon-arena:dots-and-boxes-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
