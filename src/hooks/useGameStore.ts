import { create } from "zustand";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { checkWinner, isDraw } from "@/lib/game/logic";
import type { BoardCell, Difficulty, GameMode, GameStatus } from "@/types/game";

const emptyBoard = (): BoardCell[] => [null, null, null, null, null, null, null, null, null];

export interface GameStoreState {
  readonly board: BoardCell[];
  readonly currentTurn: "X" | "O";
  readonly status: GameStatus;
  readonly winner: "X" | "O" | null;
  readonly winLine: readonly number[] | null;
  readonly mode: GameMode;
  readonly difficulty: Difficulty;
  readonly getIsMyTurn: () => boolean;
  makeMove: (index: number, meta?: { actor?: "human" | "system" }) => void;
  resetGame: () => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

function soloAiMark(role: "X" | "O" | null): "X" | "O" {
  const human = role ?? "X";
  return human === "X" ? "O" : "X";
}

function computeIsMyTurn(
  status: GameStatus,
  currentTurn: "X" | "O",
  mode: GameMode,
  role: "X" | "O" | null,
): boolean {
  if (status === "win" || status === "draw") return false;
  if (mode === "local") return true;
  if (mode === "solo") {
    if (role !== null) return currentTurn === role;
    return currentTurn === "X";
  }
  if (role === null) return false;
  return currentTurn === role;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  board: emptyBoard(),
  currentTurn: "X",
  status: "idle",
  winner: null,
  winLine: null,
  mode: "local",
  difficulty: "medium",

  getIsMyTurn: () => {
    const { status, currentTurn, mode } = get();
    const { role } = usePlayerStore.getState();
    return computeIsMyTurn(status, currentTurn, mode, role);
  },

  makeMove: (index: number, meta) => {
    if (index < 0 || index > 8) return;
    const state = get();
    if (state.board[index] !== null) return;
    if (state.status === "win" || state.status === "draw") return;

    const actor = meta?.actor ?? "human";
    if (actor === "human" && !state.getIsMyTurn()) return;
    if (actor === "system") {
      if (state.mode !== "solo") return;
      const { role } = usePlayerStore.getState();
      const ai = soloAiMark(role);
      if (state.currentTurn !== ai) return;
    }

    const mark = state.currentTurn;
    const board = [...state.board];
    board[index] = mark;

    const win = checkWinner(board);
    if (win !== null) {
      set({
        board,
        status: "win",
        winner: win.winner,
        winLine: win.line,
        currentTurn: mark,
      });
      return;
    }

    if (isDraw(board)) {
      set({
        board,
        status: "draw",
        winner: null,
        winLine: null,
        currentTurn: mark,
      });
      return;
    }

    const nextTurn = mark === "X" ? "O" : "X";
    set({
      board,
      currentTurn: nextTurn,
      status: "playing",
      winner: null,
      winLine: null,
    });
  },

  resetGame: () => {
    set({
      board: emptyBoard(),
      currentTurn: "X",
      status: "idle",
      winner: null,
      winLine: null,
    });
  },

  setMode: (mode) => {
    set({ mode });
  },

  setDifficulty: (difficulty) => {
    set({ difficulty });
  },
}));
