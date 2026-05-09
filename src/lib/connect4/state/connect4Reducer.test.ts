import { describe, it, expect } from "vitest";
import { connect4Reducer } from "./connect4Reducer";
import { createInitialState, dropDisc } from "../engine/rules";
import type { Connect4GameState } from "../types";

function playingState(): Connect4GameState {
  return { ...createInitialState(), status: "playing" };
}

describe("connect4Reducer", () => {
  describe("DROP_DISC", () => {
    it("no-ops when status is not playing", () => {
      const state = createInitialState(); // status: "idle"
      const next = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } });
      expect(next).toBe(state);
    });

    it("no-ops when column is full", () => {
      let state = playingState();
      // Fill column 0 (6 rows)
      for (let i = 0; i < 6; i++) {
        state = dropDisc(state, 0);
        if (state.status === "finished") {
          state = { ...state, status: "playing", currentPlayer: i % 2 === 0 ? 2 : 1 };
        }
      }
      const next = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 0 } });
      expect(next.board[0]).toEqual(state.board[0]);
    });

    it("places disc and transitions to playing", () => {
      const state = playingState();
      const next = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } });
      expect(next.board[3][0]).toBe(1);
      expect(next.status).toBe("playing");
      expect(next.currentPlayer).toBe(2);
      expect(next.history).toHaveLength(1);
    });
  });

  describe("UNDO_MOVE", () => {
    it("no-ops when history is empty", () => {
      const state = playingState();
      const next = connect4Reducer(state, { type: "UNDO_MOVE", payload: { mode: "local" } });
      expect(next).toBe(state);
    });

    it("undoes 1 move in local mode", () => {
      const state = playingState();
      const afterDrop = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } });
      const after = connect4Reducer(afterDrop, { type: "UNDO_MOVE", payload: { mode: "local" } });
      expect(after.history).toHaveLength(0);
      expect(after.board[3][0]).toBeNull();
    });

    it("undoes 2 moves in solo mode", () => {
      let state = playingState();
      state = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } }); // P1
      state = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 4 } }); // P2
      const after = connect4Reducer(state, { type: "UNDO_MOVE", payload: { mode: "solo" } });
      expect(after.history).toHaveLength(0);
    });

    it("undoes only available moves when fewer exist than requested (solo)", () => {
      const state = playingState();
      const afterDrop = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } }); // 1 move
      const after = connect4Reducer(afterDrop, { type: "UNDO_MOVE", payload: { mode: "solo" } });
      expect(after.history).toHaveLength(0);
    });

    it("preserves hintTokens after undo", () => {
      let state = { ...playingState(), hintTokens: 1 };
      state = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } });
      const after = connect4Reducer(state, { type: "UNDO_MOVE", payload: { mode: "local" } });
      expect(after.hintTokens).toBe(1);
    });

    it("clears hover and hint after undo", () => {
      let state: Connect4GameState = { ...playingState(), hoverCol: 2, hintCol: 5 };
      state = connect4Reducer(state, { type: "DROP_DISC", payload: { col: 3 } });
      const after = connect4Reducer(state, { type: "UNDO_MOVE", payload: { mode: "local" } });
      expect(after.hoverCol).toBeNull();
      expect(after.hintCol).toBeNull();
    });
  });

  describe("RESET_GAME", () => {
    it("returns initial state with hintTokens 3", () => {
      const state = { ...playingState(), hintTokens: 0 };
      const next = connect4Reducer(state, { type: "RESET_GAME" });
      expect(next.hintTokens).toBe(3);
      expect(next.status).toBe("idle");
      expect(next.history).toHaveLength(0);
    });
  });

  describe("HOVER_COLUMN", () => {
    it("sets hoverCol", () => {
      const state = playingState();
      const next = connect4Reducer(state, { type: "HOVER_COLUMN", payload: { col: 4 } });
      expect(next.hoverCol).toBe(4);
    });

    it("clears hoverCol to null", () => {
      const state = { ...playingState(), hoverCol: 4 };
      const next = connect4Reducer(state, { type: "HOVER_COLUMN", payload: { col: null } });
      expect(next.hoverCol).toBeNull();
    });
  });

  describe("SET_HINT / CLEAR_HINT", () => {
    it("sets hintCol and decrements hintTokens", () => {
      const state = playingState();
      const next = connect4Reducer(state, { type: "SET_HINT", payload: { col: 2 } });
      expect(next.hintCol).toBe(2);
      expect(next.hintTokens).toBe(2);
    });

    it("does not decrement below 0", () => {
      const state = { ...playingState(), hintTokens: 0 };
      const next = connect4Reducer(state, { type: "SET_HINT", payload: { col: 2 } });
      expect(next.hintTokens).toBe(0);
    });

    it("clears hintCol", () => {
      const state = { ...playingState(), hintCol: 5 };
      const next = connect4Reducer(state, { type: "CLEAR_HINT" });
      expect(next.hintCol).toBeNull();
    });
  });

  describe("SET_ANIMATING_DISC / CLEAR_ANIMATING_DISC", () => {
    it("sets animatingDisc", () => {
      const state = playingState();
      const disc = { col: 3, fromRow: 5, toRow: 0, player: 1 as const };
      const next = connect4Reducer(state, { type: "SET_ANIMATING_DISC", payload: { disc } });
      expect(next.animatingDisc).toEqual(disc);
    });

    it("clears animatingDisc", () => {
      const disc = { col: 3, fromRow: 5, toRow: 0, player: 1 as const };
      const state = { ...playingState(), animatingDisc: disc };
      const next = connect4Reducer(state, { type: "CLEAR_ANIMATING_DISC" });
      expect(next.animatingDisc).toBeNull();
    });
  });

  describe("immutability", () => {
    it("does not mutate input state", () => {
      const state = playingState();
      const frozen = Object.freeze({ ...state, board: state.board.map(Object.freeze) });
      expect(() =>
        connect4Reducer(frozen as unknown as Connect4GameState, {
          type: "DROP_DISC",
          payload: { col: 3 },
        }),
      ).not.toThrow();
    });
  });
});
