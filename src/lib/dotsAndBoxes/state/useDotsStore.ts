import { create } from "zustand";
import type { BoardSize, DotsGameState, EdgeRef } from "../types";
import { createInitialState } from "../engine/rules";
import { chooseEdgeHint } from "../engine/aiHard";
import { dotsReducer } from "./dotsReducer";

const HINT_DISPLAY_MS = 3_000;
const LAST_CLAIMED_CLEAR_MS = 600;

const DEFAULT_SIZE: BoardSize = { rows: 5, cols: 5 };

interface DotsStore extends DotsGameState {
  hoverEdge: (edge: EdgeRef | null) => void;
  claimEdge: (edge: EdgeRef) => void;
  undoMove: () => void;
  requestHint: () => void;
  clearHint: () => void;
  resetGame: (size?: BoardSize) => void;
}

export const useDotsStore = create<DotsStore>()((set, get) => ({
  ...createInitialState(DEFAULT_SIZE),

  hoverEdge: (edge) => {
    set((s) => dotsReducer(s, { type: "HOVER_EDGE", edge }));
  },

  claimEdge: (edge) => {
    set((s) => {
      const next = dotsReducer(s, { type: "CLAIM_EDGE", edge });
      return next;
    });

    // Clear lastClaimedBoxes after animation window
    setTimeout(() => {
      set((s) => ({ ...s, lastClaimedBoxes: [] }));
    }, LAST_CLAIMED_CLEAR_MS);
  },

  undoMove: () => {
    set((s) => dotsReducer(s, { type: "UNDO_MOVE" }));
  },

  requestHint: () => {
    const state = get();
    if (state.hintTokens === 0) return;
    if (state.status === "finished") return;

    // Deduct token immediately
    set((s) => ({ ...s, hintTokens: s.hintTokens - 1 }));

    const hintEdge = chooseEdgeHint(get());
    if (!hintEdge) return;

    set((s) => dotsReducer(s, { type: "SET_HINT", edge: hintEdge }));

    setTimeout(() => {
      set((s) => dotsReducer(s, { type: "CLEAR_HINT" }));
    }, HINT_DISPLAY_MS);
  },

  clearHint: () => {
    set((s) => dotsReducer(s, { type: "CLEAR_HINT" }));
  },

  resetGame: (size) => {
    set(createInitialState(size ?? get().size));
  },
}));
