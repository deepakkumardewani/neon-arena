import { describe, expect, it } from "vitest";
import {
  checkDraw,
  checkWin,
  createInitialState,
  dropDisc,
  getDropRow,
  isColumnFull,
  listLegalColumns,
} from "./rules";
import type { Board, CellValue } from "../types";

// ─── helpers ────────────────────────────────────────────────────────────────

function makeBoard(cols: CellValue[][]): Board {
  return cols as Board;
}

function emptyBoard(): Board {
  return makeBoard(Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null)));
}

function fullColumn(): CellValue[] {
  return [1, 2, 1, 2, 1, 2];
}

// ─── T03: board helpers ──────────────────────────────────────────────────────

describe("createInitialState", () => {
  it("returns 7×6 all-null board", () => {
    const state = createInitialState();
    expect(state.board).toHaveLength(7);
    state.board.forEach((col) => {
      expect(col).toHaveLength(6);
      col.forEach((cell) => expect(cell).toBeNull());
    });
  });

  it("starts with currentPlayer 1", () => {
    expect(createInitialState().currentPlayer).toBe(1);
  });

  it("starts with status idle", () => {
    expect(createInitialState().status).toBe("idle");
  });

  it("starts with hintTokens 3", () => {
    expect(createInitialState().hintTokens).toBe(3);
  });

  it("starts with all nullable fields null", () => {
    const s = createInitialState();
    expect(s.winResult).toBeNull();
    expect(s.hoverCol).toBeNull();
    expect(s.hintCol).toBeNull();
    expect(s.animatingDisc).toBeNull();
  });
});

describe("isColumnFull", () => {
  it("returns false for empty column", () => {
    expect(isColumnFull(emptyBoard(), 0)).toBe(false);
  });

  it("returns false for partially filled column", () => {
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) =>
        i === 3 ? [1, null, null, null, null, null] : Array<CellValue>(6).fill(null),
      ),
    );
    expect(isColumnFull(board, 3)).toBe(false);
  });

  it("returns true when column has no null", () => {
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) =>
        i === 2 ? fullColumn() : Array<CellValue>(6).fill(null),
      ),
    );
    expect(isColumnFull(board, 2)).toBe(true);
  });
});

describe("listLegalColumns", () => {
  it("returns all 7 cols on empty board", () => {
    expect(listLegalColumns(emptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("excludes full columns", () => {
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) =>
        i === 0 || i === 6 ? fullColumn() : Array<CellValue>(6).fill(null),
      ),
    );
    expect(listLegalColumns(board)).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns empty array when all columns full", () => {
    const board = makeBoard(Array.from({ length: 7 }, () => fullColumn()));
    expect(listLegalColumns(board)).toEqual([]);
  });
});

describe("getDropRow", () => {
  it("returns 0 for empty column", () => {
    expect(getDropRow(emptyBoard(), 0)).toBe(0);
  });

  it("returns correct row for partially filled column", () => {
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) =>
        i === 1 ? [1, 2, null, null, null, null] : Array<CellValue>(6).fill(null),
      ),
    );
    expect(getDropRow(board, 1)).toBe(2);
  });

  it("returns -1 for full column", () => {
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) =>
        i === 4 ? fullColumn() : Array<CellValue>(6).fill(null),
      ),
    );
    expect(getDropRow(board, 4)).toBe(-1);
  });
});

// ─── T04: dropDisc + checkWin ────────────────────────────────────────────────

describe("checkWin", () => {
  it("returns null when fewer than 4 in a row", () => {
    let board = emptyBoard();
    // Place 3 horizontally
    board = dropDisc({ ...createInitialState(), board, status: "playing" }, 0).board;
    board = dropDisc(
      { ...createInitialState(), board, status: "playing", currentPlayer: 1 },
      1,
    ).board;
    const state = {
      ...createInitialState(),
      board,
      status: "playing" as const,
      currentPlayer: 1 as const,
    };
    board = dropDisc(state, 2).board;
    expect(checkWin(board, 2, 0, 1)).toBeNull();
  });

  it("detects horizontal win", () => {
    // P1 drops in cols 0,1,2,3; P2 in col 0 rows 1-3 (interleaved doesn't matter — we build manually)
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[0][0] = 1;
    cols[1][0] = 1;
    cols[2][0] = 1;
    cols[3][0] = 1;
    const board = makeBoard(cols);
    const result = checkWin(board, 3, 0, 1);
    expect(result?.winner).toBe(1);
    expect(result?.cells).toHaveLength(4);
  });

  it("detects vertical win", () => {
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[2][0] = 1;
    cols[2][1] = 1;
    cols[2][2] = 1;
    cols[2][3] = 1;
    const board = makeBoard(cols);
    const result = checkWin(board, 2, 3, 1);
    expect(result?.winner).toBe(1);
  });

  it("detects diagonal ↗ win", () => {
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[0][0] = 1;
    cols[1][1] = 1;
    cols[2][2] = 1;
    cols[3][3] = 1;
    const board = makeBoard(cols);
    const result = checkWin(board, 3, 3, 1);
    expect(result?.winner).toBe(1);
  });

  it("detects diagonal ↘ win", () => {
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[0][3] = 1;
    cols[1][2] = 1;
    cols[2][1] = 1;
    cols[3][0] = 1;
    const board = makeBoard(cols);
    const result = checkWin(board, 3, 0, 1);
    expect(result?.winner).toBe(1);
  });
});

describe("dropDisc", () => {
  it("places disc at correct row and switches player", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    const next = dropDisc(state, 3);
    expect(next.board[3][0]).toBe(1);
    expect(next.currentPlayer).toBe(2);
  });

  it("is a no-op on full column", () => {
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[0] = fullColumn();
    const state = { ...createInitialState(), board: makeBoard(cols), status: "playing" as const };
    const next = dropDisc(state, 0);
    expect(next).toBe(state);
  });

  it("appends to history", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    const next = dropDisc(state, 2);
    expect(next.history).toHaveLength(1);
    expect(next.history[0]).toEqual({ col: 2, row: 0, player: 1 });
  });

  it("sets animatingDisc", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    const next = dropDisc(state, 0);
    expect(next.animatingDisc).not.toBeNull();
    expect(next.animatingDisc?.col).toBe(0);
    expect(next.animatingDisc?.toRow).toBe(0);
  });

  it("sets status finished and winResult on winning move", () => {
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[0][0] = 1;
    cols[1][0] = 1;
    cols[2][0] = 1;
    const state = { ...createInitialState(), board: makeBoard(cols), status: "playing" as const };
    const next = dropDisc(state, 3);
    expect(next.status).toBe("finished");
    expect(next.winResult?.winner).toBe(1);
  });

  it("history grows correctly across multiple moves", () => {
    let state: import("../types").Connect4GameState = {
      ...createInitialState(),
      status: "playing" as const,
    };
    state = dropDisc(state, 0);
    state = dropDisc(state, 1);
    state = dropDisc(state, 2);
    expect(state.history).toHaveLength(3);
  });
});

// ─── T05: checkDraw ──────────────────────────────────────────────────────────

describe("checkDraw", () => {
  it("returns false on empty board", () => {
    expect(checkDraw(emptyBoard())).toBe(false);
  });

  it("returns false on partial board", () => {
    const cols: CellValue[][] = Array.from({ length: 7 }, () => Array<CellValue>(6).fill(null));
    cols[0] = fullColumn();
    expect(checkDraw(makeBoard(cols))).toBe(false);
  });

  it("returns true when all 42 cells filled", () => {
    const board = makeBoard(Array.from({ length: 7 }, () => fullColumn()));
    expect(checkDraw(board)).toBe(true);
  });
});

describe("dropDisc draw detection", () => {
  it("sets isDraw and status finished when last disc fills board with no winner", () => {
    // Board with 41 cells filled; drop at (3,5) for player 1 must NOT create 4-in-a-row.
    // Chosen so no diagonal/horizontal/vertical of 4 passes through (col=3, row=5) after the drop.
    const cols: CellValue[][] = [
      [2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2],
      [2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, null], // last slot — drop player 1 here at row 5
      [2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2],
      [2, 1, 2, 1, 2, 1],
    ];
    const state = {
      ...createInitialState(),
      board: makeBoard(cols),
      status: "playing" as const,
      currentPlayer: 1 as const,
    };
    const next = dropDisc(state, 3);
    expect(next.isDraw).toBe(true);
    expect(next.status).toBe("finished");
    expect(next.winResult).toBeNull();
  });

  it("win takes precedence over draw", () => {
    // 41 cells filled; the last move wins
    // Build a state where dropping at col 3 would create vertical 4-in-a-row for player 1
    // Need 4 consecutive 1s in col 3: rows 1,2 are 1,2 — not vertical. Let's use horizontal.
    // Simpler: use a board near-full where last move wins horizontally
    const cols2: CellValue[][] = [
      [1, 2, 1, 2, 1, 2],
      [2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2],
      [null, 2, 1, 2, 1, 2], // row 0 = null; dropping 1 here
      [1, 1, 1, 2, 1, 2], // not 4 in row
      [2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2],
    ];
    // Place horizontal win at row 0: cols 0,1,2 already have 1 at row 0; drop in col 3 row 0 => 4 in a row
    cols2[0][0] = 1;
    cols2[1][0] = 1;
    cols2[2][0] = 1;
    cols2[3][0] = null; // will drop here
    const state2 = {
      ...createInitialState(),
      board: makeBoard(cols2),
      status: "playing" as const,
      currentPlayer: 1 as const,
    };
    const next2 = dropDisc(state2, 3);
    expect(next2.isDraw).toBe(false);
    expect(next2.winResult?.winner).toBe(1);
  });
});
