import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ScoreDoc } from "@/types/player";

export interface PlayerStoreState {
  nickname: string;
  uid: string;
  role: "X" | "O" | null;
  score: ScoreDoc;
  setNickname: (nickname: string) => void;
  setUid: (uid: string) => void;
  setRole: (role: "X" | "O" | null) => void;
  setScore: (score: ScoreDoc) => void;
}

const initialScore = (): ScoreDoc => ({
  uid: "",
  nickname: "",
  wins: 0,
  losses: 0,
  draws: 0,
});

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (set) => ({
      nickname: "",
      uid: "",
      role: null,
      score: initialScore(),
      setNickname: (nickname) => set({ nickname }),
      setUid: (uid) => set({ uid }),
      setRole: (role) => set({ role }),
      setScore: (score) => set({ score }),
    }),
    {
      name: "na-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nickname: state.nickname,
        uid: state.uid,
      }),
    },
  ),
);
