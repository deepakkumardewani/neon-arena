import { createInitialState, dropDisc as rulesDropDisc, isColumnFull } from "../engine/rules";
import type { AnimatingDisc, Connect4GameState } from "../types";

export type Connect4Action =
  | { type: "DROP_DISC"; payload: { col: number } }
  | { type: "UNDO_MOVE"; payload: { mode: "solo" | "local" } }
  | { type: "RESET_GAME" }
  | { type: "HOVER_COLUMN"; payload: { col: number | null } }
  | { type: "SET_HINT"; payload: { col: number } }
  | { type: "CLEAR_HINT" }
  | { type: "SET_ANIMATING_DISC"; payload: { disc: AnimatingDisc } }
  | { type: "CLEAR_ANIMATING_DISC" };

export function connect4Reducer(
  state: Connect4GameState,
  action: Connect4Action,
): Connect4GameState {
  switch (action.type) {
    case "DROP_DISC": {
      if (state.status !== "playing") return state;
      if (isColumnFull(state.board, action.payload.col)) return state;
      return rulesDropDisc(state, action.payload.col);
    }

    case "UNDO_MOVE": {
      if (state.history.length === 0) return state;
      const movesToRemove = action.payload.mode === "solo" ? 2 : 1;
      const actualRemove = Math.min(movesToRemove, state.history.length);
      const newHistory = state.history.slice(0, state.history.length - actualRemove);

      // Rebuild board by replaying remaining history from scratch
      let rebuilt = createInitialState();
      for (const move of newHistory) {
        rebuilt = rulesDropDisc(rebuilt, move.col);
      }

      return {
        ...rebuilt,
        hintTokens: state.hintTokens,
        hoverCol: null,
        hintCol: null,
        animatingDisc: null,
      };
    }

    case "RESET_GAME": {
      return { ...createInitialState(), hintTokens: 3 };
    }

    case "HOVER_COLUMN": {
      return { ...state, hoverCol: action.payload.col };
    }

    case "SET_HINT": {
      return {
        ...state,
        hintCol: action.payload.col,
        hintTokens: Math.max(0, state.hintTokens - 1),
      };
    }

    case "CLEAR_HINT": {
      return { ...state, hintCol: null };
    }

    case "SET_ANIMATING_DISC": {
      return { ...state, animatingDisc: action.payload.disc };
    }

    case "CLEAR_ANIMATING_DISC": {
      return { ...state, animatingDisc: null };
    }

    default:
      return state;
  }
}
