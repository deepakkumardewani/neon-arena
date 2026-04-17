import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AudioStoreState {
  masterMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
  setMasterMuted: (masterMuted: boolean) => void;
  setSfxVolume: (sfxVolume: number) => void;
  setMusicVolume: (musicVolume: number) => void;
}

export const useAudioStore = create<AudioStoreState>()(
  persist(
    (set) => ({
      masterMuted: false,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      setMasterMuted: (masterMuted) => set({ masterMuted }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
    }),
    {
      name: "na-audio",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
