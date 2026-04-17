import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ScoreDoc } from "@/types/player";

export interface PlayerStoreState {
  nickname: string;
  /** Second human in local pass-and-play (player O). */
  localGuestNickname: string;
  uid: string;
  role: "X" | "O" | null;
  score: ScoreDoc;
  setNickname: (nickname: string) => void;
  setLocalGuestNickname: (localGuestNickname: string) => void;
  setUid: (uid: string) => void;
  setRole: (role: "X" | "O" | null) => void;
  setScore: (score: ScoreDoc) => void;
  /** Offline solo session stats (persisted with score). */
  applySoloOutcome: (outcome: "win" | "loss" | "draw") => void;
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
      localGuestNickname: "Player 2",
      uid: "",
      role: null,
      score: initialScore(),
      setNickname: (nickname) => set({ nickname }),
      setLocalGuestNickname: (localGuestNickname) => set({ localGuestNickname }),
      setUid: (uid) => set({ uid }),
      setRole: (role) => set({ role }),
      setScore: (score) => set({ score }),
      applySoloOutcome: (outcome) =>
        set((s) => {
          const prev = s.score;
          if (outcome === "win") {
            return { score: { ...prev, wins: prev.wins + 1 } };
          }
          if (outcome === "loss") {
            return { score: { ...prev, losses: prev.losses + 1 } };
          }
          return { score: { ...prev, draws: prev.draws + 1 } };
        }),
    }),
    {
      name: "na-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nickname: state.nickname,
        localGuestNickname: state.localGuestNickname,
        uid: state.uid,
      }),
    },
  ),
);
