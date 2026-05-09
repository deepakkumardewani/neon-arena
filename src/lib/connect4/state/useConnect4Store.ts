import { create } from "zustand";
import { createInitialState, getDropRow } from "../engine/rules";
import { chooseColumn as hardChooseColumn } from "../engine/aiHard";
import type { Connect4GameState } from "../types";
import { connect4Reducer } from "./connect4Reducer";

const HINT_DISPLAY_MS = 3_000;
const ROWS = 6;
const LAND_PULSE_MS = 120;

interface Connect4StoreState {
  state: Connect4GameState;
}

interface Connect4StoreActions {
  hoverColumn: (col: number | null) => void;
  dropDisc: (col: number, animationSpeedMs?: number) => void;
  undoMove: (mode: "solo" | "local") => void;
  requestHint: () => void;
  clearHint: () => void;
  resetGame: () => void;
}

export const useConnect4Store = create<Connect4StoreState & Connect4StoreActions>((set, get) => ({
  state: createInitialState(),

  hoverColumn: (col) => {
    set((store) => ({
      state: connect4Reducer(store.state, {
        type: "HOVER_COLUMN",
        payload: { col },
      }),
    }));
  },

  dropDisc: (col, animationSpeedMs = 60) => {
    const { state } = get();
    if (state.status !== "playing") return;

    const toRow = getDropRow(state.board, col);
    if (toRow === -1) return; // column full

    const rowsTravelled = ROWS - 1 - toRow;
    const animDuration = animationSpeedMs * Math.max(rowsTravelled, 1);

    set((store) => ({
      state: connect4Reducer(store.state, {
        type: "DROP_DISC",
        payload: { col },
      }),
    }));

    if (animationSpeedMs > 0) {
      setTimeout(() => {
        set((store) => ({
          state: connect4Reducer(store.state, { type: "CLEAR_ANIMATING_DISC" }),
        }));
      }, animDuration + LAND_PULSE_MS);
    } else {
      // Instant placement — clear immediately
      set((store) => ({
        state: connect4Reducer(store.state, { type: "CLEAR_ANIMATING_DISC" }),
      }));
    }
  },

  undoMove: (mode) => {
    set((store) => ({
      state: connect4Reducer(store.state, {
        type: "UNDO_MOVE",
        payload: { mode },
      }),
    }));
  },

  requestHint: () => {
    const { state } = get();
    if (state.hintTokens <= 0) return;
    if (state.status !== "playing") return;

    const col = hardChooseColumn(state, { maxDepth: 6 });
    set((store) => ({
      state: connect4Reducer(store.state, {
        type: "SET_HINT",
        payload: { col },
      }),
    }));

    setTimeout(() => {
      get().clearHint();
    }, HINT_DISPLAY_MS);
  },

  clearHint: () => {
    set((store) => ({
      state: connect4Reducer(store.state, { type: "CLEAR_HINT" }),
    }));
  },

  resetGame: () => {
    set({ state: createInitialState() });
  },
}));
