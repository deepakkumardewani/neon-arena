import { describe, expect, test } from "vitest";
import { docToState, stateToDoc, buildCommitPayload } from "./connect4GameMappers";
import type { GameDoc } from "@/types/firebase";

function makeDoc(overrides: Record<string, unknown> = {}): GameDoc {
  return {
    gameId: "test-game",
    gameType: "connect4",
    playerX: { uid: "p1", nickname: "Player 1" },
    playerO: { uid: "p2", nickname: "Player 2" },
    board: [],
    currentTurn: "p1",
    status: "active",
    winner: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 600_000,
    disconnectedAt: null,
    disconnectedBy: null,
    rematch: {},
    ...overrides,
  } as unknown as GameDoc;
}

describe("connect4GameMappers", () => {
  describe("docToState", () => {
    test("maps an active game document to game state", () => {
      const c4board = Array.from({ length: 7 }, () => Array(6).fill(0));
      c4board[3][0] = 1; // Player 1 dropped in col 3
      const doc = makeDoc({
        c4board,
        c4history: [{ col: 3, row: 0, player: 1 }],
        c4winCells: null,
      });

      const state = docToState(doc);

      expect(state.status).toBe("playing");
      expect(state.currentPlayer).toBe(2); // next turn
      expect(state.board[3][0]).toBe(1);
      expect(state.board[0][0]).toBe(null);
      expect(state.winResult).toBeNull();
      expect(state.isDraw).toBe(false);
      expect(state.hintTokens).toBe(3);
    });

    test("maps a finished game with winner", () => {
      const c4board = Array.from({ length: 7 }, () => Array(6).fill(0));
      c4board[0][0] = 1;
      c4board[0][1] = 2;
      c4board[1][0] = 1;
      c4board[1][1] = 2;
      c4board[2][0] = 1;
      c4board[2][1] = 2;
      c4board[3][0] = 1;
      const doc = makeDoc({
        c4board,
        c4history: [
          { col: 0, row: 0, player: 1 },
          { col: 0, row: 1, player: 2 },
          { col: 1, row: 0, player: 1 },
          { col: 1, row: 1, player: 2 },
          { col: 2, row: 0, player: 1 },
          { col: 2, row: 1, player: 2 },
          { col: 3, row: 0, player: 1 },
        ],
        c4winCells: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
        ],
        status: "finished",
        winner: "p1",
      });

      const state = docToState(doc);

      expect(state.status).toBe("finished");
      expect(state.winResult).not.toBeNull();
      expect(state.winResult!.winner).toBe(1);
      expect(state.winResult!.cells).toHaveLength(4);
    });

    test("maps a draw", () => {
      const doc = makeDoc({
        c4board: Array.from({ length: 7 }, () => Array(6).fill(2)),
        c4history: [],
        c4winCells: null,
        status: "finished",
        winner: "draw",
      });

      const state = docToState(doc);

      expect(state.status).toBe("finished");
      expect(state.isDraw).toBe(true);
      expect(state.winResult).toBeNull();
    });

    test("handles null cells correctly (not undefined)", () => {
      const c4board = Array.from({ length: 7 }, () => Array(6).fill(0));
      const doc = makeDoc({ c4board, c4history: [], c4winCells: null });

      const state = docToState(doc);

      // All cells should be null, not undefined
      for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 6; row++) {
          expect(state.board[col][row]).toBe(null);
          expect(state.board[col][row]).not.toBeUndefined();
        }
      }
    });

    test("returns empty board when c4board is missing", () => {
      const doc = makeDoc({ c4history: [] });
      const state = docToState(doc);
      expect(state.board).toEqual([]);
    });

    test("waiting status maps to idle", () => {
      const doc = makeDoc({
        status: "waiting",
        c4board: [],
        c4history: [],
        c4winCells: null,
      });
      const state = docToState(doc);
      expect(state.status).toBe("idle");
    });
  });

  describe("stateToDoc", () => {
    test("produces correct patch fields", () => {
      const state = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null as 1 | 2 | null)),
        currentPlayer: 2 as const,
        status: "playing" as const,
        winResult: null,
        isDraw: false,
        history: [{ col: 3, row: 0, player: 1 as const }],
        hoverCol: null,
        hintCol: null,
        hintTokens: 3,
        animatingDisc: null,
      };
      // Place disc
      state.board[3][0] = 1;

      const payload = stateToDoc(state, { col: 3, row: 0, player: 1 });

      expect(payload.c4board).toBeDefined();
      expect(payload.c4board[3][0]).toBe(1);
      expect(payload.c4board[0][0]).toBe(0);
      expect(payload.c4history).toHaveLength(1);
      expect(payload.currentTurn).toBe("player2");
      expect(payload.c4winCells).toBeNull();
      expect(typeof payload.lastMoveAt).toBe("number");
    });

    test("serializes winCells correctly", () => {
      const state = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null as 1 | 2 | null)),
        currentPlayer: 1 as const,
        status: "finished" as const,
        winResult: {
          winner: 1 as const,
          cells: [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
          ] as readonly [number, number][],
        },
        isDraw: false,
        history: [],
        hoverCol: null,
        hintCol: null,
        hintTokens: 3,
        animatingDisc: null,
      };

      const payload = stateToDoc(state, { col: 3, row: 0, player: 1 });

      expect(payload.c4winCells).toEqual([
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ]);
    });
  });

  describe("round-trip", () => {
    test("docToState(stateToDoc(state)) preserves key fields", () => {
      const c4board = Array.from({ length: 7 }, () => Array(6).fill(0));
      c4board[3][0] = 1;
      c4board[2][0] = 2;

      const doc = makeDoc({
        c4board,
        c4history: [
          { col: 3, row: 0, player: 1 },
          { col: 2, row: 0, player: 2 },
        ],
        c4winCells: null,
      });

      const state = docToState(doc);
      // state.board is Connect4GameState - use stateToDoc
      // stateToDoc needs a move, use the last one
      const payload = stateToDoc(state, {
        col: 2,
        row: 0,
        player: 2,
      });

      expect(payload.c4board[3][0]).toBe(1);
      expect(payload.c4board[2][0]).toBe(2);
      expect(payload.c4board[0][0]).toBe(0);
    });
  });

  describe("buildCommitPayload", () => {
    test("builds payload with explicit nextTurn", () => {
      const state = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null as 1 | 2 | null)),
        currentPlayer: 2 as const,
        status: "playing" as const,
        winResult: null,
        isDraw: false,
        history: [{ col: 0, row: 0, player: 1 as const }],
        hoverCol: null,
        hintCol: null,
        hintTokens: 3,
        animatingDisc: null,
      };
      state.board[0][0] = 1;

      const payload = buildCommitPayload(state, "player2");

      expect(payload.currentTurn).toBe("player2");
      expect(payload.c4history).toHaveLength(1);
    });
  });
});
