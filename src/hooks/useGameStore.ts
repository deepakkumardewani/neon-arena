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
  /** HUD names for networked modes (from Firestore players). */
  readonly onlineHudNames: { readonly x: string; readonly o: string } | null;
  /** Friend mode: first Firestore snapshot received for this page session. */
  readonly friendFirestoreSynced: boolean;
  /** Friend mode: we are player X and the room is still waiting for player O. */
  readonly friendHostWaiting: boolean;
  /** Friend mode: we are not in this game yet and must join (or redirect to nickname). */
  readonly friendJoinRequired: boolean;
  readonly getIsMyTurn: () => boolean;
  makeMove: (index: number, meta?: { actor?: "human" | "system" }) => void;
  resetGame: () => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setOnlineHudNames: (names: { x: string; o: string } | null) => void;
  setFriendRoomFromFirestore: (payload: {
    readonly synced: boolean;
    readonly hostWaiting: boolean;
    readonly joinRequired: boolean;
  }) => void;
  applyRemoteState: (payload: {
    readonly board: BoardCell[];
    readonly currentTurn: "X" | "O";
    readonly status: GameStatus;
    readonly winner: "X" | "O" | null;
    readonly winLine: readonly number[] | null;
  }) => void;
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
  if ((mode === "online" || mode === "friend") && status === "idle") return false;
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
  onlineHudNames: null,
  friendFirestoreSynced: false,
  friendHostWaiting: false,
  friendJoinRequired: false,

  getIsMyTurn: () => {
    const { status, currentTurn, mode } = get();
    const { role } = usePlayerStore.getState();
    return computeIsMyTurn(status, currentTurn, mode, role);
  },

  makeMove: (index: number, meta) => {
    const state = get();
    if (state.mode === "online" || state.mode === "friend") return;
    if (index < 0 || index > 8) return;
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
      onlineHudNames: null,
      friendFirestoreSynced: false,
      friendHostWaiting: false,
      friendJoinRequired: false,
    });
  },

  setMode: (mode) => {
    set({ mode });
  },

  setDifficulty: (difficulty) => {
    set({ difficulty });
  },

  setOnlineHudNames: (names) => {
    set({ onlineHudNames: names });
  },

  setFriendRoomFromFirestore: (payload) => {
    set({
      friendFirestoreSynced: payload.synced,
      friendHostWaiting: payload.hostWaiting,
      friendJoinRequired: payload.joinRequired,
    });
  },

  applyRemoteState: (payload) => {
    set({
      board: [...payload.board],
      currentTurn: payload.currentTurn,
      status: payload.status,
      winner: payload.winner,
      winLine: payload.winLine === null ? null : [...payload.winLine],
    });
  },
}));
