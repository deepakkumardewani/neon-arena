import { describe, it, expect } from "vitest";
import type { ChessGameState } from "../types";
import { chessReducer } from "./chessReducer";

const createInitialState = (): ChessGameState => ({
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  history: [],
  capturedByWhite: [],
  capturedByBlack: [],
  status: "playing",
  activeColor: "white",
  promotionPending: null,
  selectedSquare: null,
  legalMoves: [],
  hintFrom: null,
  hintTo: null,
  hintTokens: 3,
  enPassantSquare: null,
});

describe("chessReducer", () => {
  describe("SELECT_SQUARE", () => {
    it("sets selectedSquare and populates legalMoves", () => {
      const state = createInitialState();
      const result = chessReducer(state, {
        type: "SELECT_SQUARE",
        payload: {
          square: 12, // e2
          legalMoves: [20, 28], // e3, e4
        },
      });
      expect(result.selectedSquare).toBe(12);
      expect(result.legalMoves).toEqual([20, 28]);
    });

    it("deselects (toggles off) when selecting the same square", () => {
      const state = createInitialState();
      const afterSelect = chessReducer(state, {
        type: "SELECT_SQUARE",
        payload: {
          square: 12,
          legalMoves: [20, 28],
        },
      });
      const afterToggle = chessReducer(afterSelect, {
        type: "SELECT_SQUARE",
        payload: {
          square: 12,
          legalMoves: [20, 28],
        },
      });
      expect(afterToggle.selectedSquare).toBeNull();
      expect(afterToggle.legalMoves).toEqual([]);
    });

    it("clears selection when legalMoves is empty (enemy square)", () => {
      const state = createInitialState();
      const result = chessReducer(state, {
        type: "SELECT_SQUARE",
        payload: {
          square: 0,
          legalMoves: [],
        },
      });
      expect(result.selectedSquare).toBeNull();
      expect(result.legalMoves).toEqual([]);
    });
  });

  describe("EXECUTE_MOVE", () => {
    it("appends to moveHistory and clears selectedSquare + legalMoves", () => {
      const state = createInitialState();
      const move = {
        from: 12,
        to: 20,
        san: "e4",
      };
      const result = chessReducer(state, {
        type: "EXECUTE_MOVE",
        payload: {
          move,
          currentTurn: "black",
          status: "playing" as const,
          capturedByWhite: [],
          capturedByBlack: [],
        },
      });
      expect(result.history).toHaveLength(1);
      expect(result.history[0]).toEqual(move);
      expect(result.selectedSquare).toBeNull();
      expect(result.legalMoves).toEqual([]);
    });

    it("sets promotionPending when provided in payload", () => {
      const state = createInitialState();
      const result = chessReducer(state, {
        type: "EXECUTE_MOVE",
        payload: {
          move: { from: 8, to: 0, san: "a8=Q" },
          currentTurn: "black",
          status: "playing" as const,
          capturedByWhite: [],
          capturedByBlack: [],
          promotionPending: { from: 8, to: 0 },
        },
      });
      expect(result.promotionPending).toEqual({ from: 8, to: 0 });
    });

    it("does not set promotionPending when not in payload", () => {
      const state = createInitialState();
      const result = chessReducer(state, {
        type: "EXECUTE_MOVE",
        payload: {
          move: { from: 12, to: 20, san: "e4" },
          currentTurn: "black",
          status: "playing" as const,
          capturedByWhite: [],
          capturedByBlack: [],
        },
      });
      expect(result.promotionPending).toBeNull();
    });
  });

  describe("UNDO_MOVE", () => {
    it("removes the last entry from history", () => {
      const baseState = createInitialState();
      const state: ChessGameState = {
        ...baseState,
        history: [
          { from: 12, to: 20, san: "e4" },
          { from: 12, to: 20, san: "e5" },
        ],
      };
      const result = chessReducer(state, {
        type: "UNDO_MOVE",
        payload: {
          currentTurn: "white",
          status: "playing" as const,
          movesToRemove: 1,
        },
      });
      expect(result.history).toHaveLength(1);
      expect(result.history[0].san).toBe("e4");
    });

    it("removes multiple moves when movesToRemove > 1", () => {
      const baseState = createInitialState();
      const state: ChessGameState = {
        ...baseState,
        history: [
          { from: 12, to: 20, san: "e4" },
          { from: 12, to: 20, san: "e5" },
          { from: 6, to: 22, san: "Nf3" },
        ],
      };
      const result = chessReducer(state, {
        type: "UNDO_MOVE",
        payload: {
          currentTurn: "black",
          status: "playing" as const,
          movesToRemove: 2,
        },
      });
      expect(result.history).toHaveLength(1);
      expect(result.history[0].san).toBe("e4");
    });
  });

  describe("RESOLVE_PROMOTION", () => {
    it("clears promotionPending and updates board", () => {
      const baseState = createInitialState();
      const state: ChessGameState = {
        ...baseState,
        promotionPending: { from: 8, to: 0 },
      };
      const result = chessReducer(state, {
        type: "RESOLVE_PROMOTION",
        payload: {
          piece: "queen",
        },
      });
      expect(result.promotionPending).toBeNull();
    });
  });

  describe("SET_HINT", () => {
    it("sets hintMove and decrements hintTokens", () => {
      const state = createInitialState();
      expect(state.hintTokens).toBe(3);
      const result = chessReducer(state, {
        type: "SET_HINT",
        payload: {
          fromSquare: 12,
          toSquare: 20,
        },
      });
      expect(result.hintFrom).toBe(12);
      expect(result.hintTo).toBe(20);
      expect(result.hintTokens).toBe(2);
    });

    it("prevents hintTokens from going below 0", () => {
      const baseState = createInitialState();
      const state: ChessGameState = {
        ...baseState,
        hintTokens: 0,
      };
      const result = chessReducer(state, {
        type: "SET_HINT",
        payload: {
          fromSquare: 12,
          toSquare: 20,
        },
      });
      expect(result.hintTokens).toBe(0);
    });
  });

  describe("CLEAR_HINT", () => {
    it("sets hintMove to null", () => {
      const baseState = createInitialState();
      const state: ChessGameState = {
        ...baseState,
        hintFrom: 12,
        hintTo: 20,
      };
      const result = chessReducer(state, {
        type: "CLEAR_HINT",
      });
      expect(result.hintFrom).toBeNull();
      expect(result.hintTo).toBeNull();
    });
  });

  describe("RESET_GAME", () => {
    it("returns the provided initial state", () => {
      const freshState = createInitialState();
      const result = chessReducer(freshState, {
        type: "RESET_GAME",
        payload: {
          initialState: freshState,
        },
      });
      expect(result).toEqual(freshState);
      expect(result.history).toHaveLength(0);
      expect(result.selectedSquare).toBeNull();
    });
  });
});
