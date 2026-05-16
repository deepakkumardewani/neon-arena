import type { BoardSize, DotsGameState, EdgeRef } from "../types";
import { claimEdge, createInitialState } from "../engine/rules";

// ── Action types ─────────────────────────────────────────────────────────────

export type DotsAction =
  | { type: "CLAIM_EDGE"; edge: EdgeRef }
  | { type: "UNDO_MOVE" }
  | { type: "RESET_GAME"; size: BoardSize }
  | { type: "HOVER_EDGE"; edge: EdgeRef | null }
  | { type: "SET_HINT"; edge: EdgeRef }
  | { type: "CLEAR_HINT" };

// ── Reducer ──────────────────────────────────────────────────────────────────

export function dotsReducer(state: DotsGameState, action: DotsAction): DotsGameState {
  switch (action.type) {
    case "CLAIM_EDGE": {
      if (state.status === "finished") return state;
      return claimEdge(state, action.edge);
    }

    case "UNDO_MOVE": {
      if (state.history.length === 0) return state;

      // Rewind to the last human move: in solo mode the AI may have played
      // multiple consecutive moves (bonus-turn chains). We rebuild state from
      // scratch by replaying all moves except those at the tail that were played
      // by the same player as the very last move in the chain.
      const lastPlayer = state.history[state.history.length - 1].player;
      let cutIndex = state.history.length - 1;

      // Walk backwards while the moves belong to `lastPlayer` consecutively
      // (bonus-turn chain). Stop one step *before* we'd remove a human move
      // that preceded it — we want to remove the last full turn (which may
      // include AI bonus moves).
      while (cutIndex > 0 && state.history[cutIndex - 1].player === lastPlayer) {
        cutIndex--;
      }

      // Also remove one preceding move of the *other* player if the last player
      // is the AI (player 2 in solo) — we want to undo back to the human turn.
      // Detect this by checking if the move before cutIndex belongs to the
      // opposite player and cutIndex > 0.
      if (cutIndex > 0 && state.history[cutIndex - 1].player !== lastPlayer) {
        // Remove both the human's last move and the AI's response chain.
        cutIndex--;
      }

      const movesToKeep = state.history.slice(0, cutIndex);
      let rebuilt = createInitialState(state.size);
      rebuilt = { ...rebuilt, hintTokens: state.hintTokens };

      for (const move of movesToKeep) {
        rebuilt = claimEdge(rebuilt, move.edge);
      }

      return {
        ...rebuilt,
        hoveredEdge: null,
        hintEdge: null,
        lastClaimedBoxes: [],
      };
    }

    case "RESET_GAME": {
      return createInitialState(action.size);
    }

    case "HOVER_EDGE": {
      return { ...state, hoveredEdge: action.edge };
    }

    case "SET_HINT": {
      return { ...state, hintEdge: action.edge };
    }

    case "CLEAR_HINT": {
      return { ...state, hintEdge: null };
    }
  }
}
