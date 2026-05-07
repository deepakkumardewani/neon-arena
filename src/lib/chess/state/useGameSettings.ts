import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ── Chess settings ──────────────────────────────────────────────────────────

export interface ChessSettings {
  showMoveHistory: boolean;
  showCapturedPieces: boolean;
  allowUndo: boolean;
  hintsEnabled: boolean;
  autoHintDelayMs: number;
}

interface ChessSettingsStore extends ChessSettings {
  updateSetting: <K extends keyof ChessSettings>(key: K, value: ChessSettings[K]) => void;
  resetSettings: () => void;
}

const DEFAULT_CHESS_SETTINGS: ChessSettings = {
  showMoveHistory: true,
  showCapturedPieces: true,
  allowUndo: true,
  hintsEnabled: true,
  autoHintDelayMs: 30_000,
};

export const useChessSettings = create<ChessSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CHESS_SETTINGS,
      updateSetting: <K extends keyof ChessSettings>(key: K, value: ChessSettings[K]) => {
        set({ [key]: value } as Partial<ChessSettingsStore>);
      },
      resetSettings: () => set(DEFAULT_CHESS_SETTINGS),
    }),
    {
      name: "neon-arena:chess-settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
