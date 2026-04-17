import { describe, expect, it } from "vite-plus/test";

import {
  WIN_LINES,
  checkWinner,
  getAvailableCells,
  getWinningMoveIndex,
  isDraw,
} from "@/lib/game/logic";
import type { BoardCell } from "@/types/game";

const b = (...cells: BoardCell[]): BoardCell[] => [...cells];

describe("checkWinner", () => {
  for (const line of WIN_LINES) {
    it(`detects X win on line ${line.join("-")}`, () => {
      const board = b(null, null, null, null, null, null, null, null, null);
      const [i, j, k] = line;
      board[i] = "X";
      board[j] = "X";
      board[k] = "X";
      const result = checkWinner(board);
      expect(result).toEqual({ winner: "X", line: [...line] });
    });
  }

  it("detects O win on first row", () => {
    const board = b("O", "O", "O", null, "X", null, null, null, "X");
    expect(checkWinner(board)).toEqual({ winner: "O", line: [0, 1, 2] });
  });

  it("returns null when no winner", () => {
    const board = b("X", "O", "X", "X", "O", "O", "O", "X", null);
    expect(checkWinner(board)).toBeNull();
  });

  it("returns null on empty board", () => {
    expect(checkWinner(b(null, null, null, null, null, null, null, null, null))).toBeNull();
  });
});

describe("isDraw", () => {
  it("is true when board is full and there is no winner", () => {
    const board = b("X", "O", "X", "O", "X", "X", "O", "X", "O");
    expect(isDraw(board)).toBe(true);
  });

  it("is false when winner exists on full board (impossible in play but guarded)", () => {
    const board = b("X", "X", "X", "O", "O", null, null, null, null);
    expect(isDraw(board)).toBe(false);
  });

  it("is false when board incomplete", () => {
    expect(isDraw(b("X", null, null, null, null, null, null, null, null))).toBe(false);
  });
});

describe("getAvailableCells", () => {
  it("returns all indices on empty board", () => {
    expect(getAvailableCells(b(null, null, null, null, null, null, null, null, null))).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("returns only empty slots", () => {
    expect(getAvailableCells(b("X", null, "O", null, null, null, null, null, null))).toEqual([
      1, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("returns empty array when full", () => {
    expect(getAvailableCells(b("X", "O", "X", "O", "X", "X", "O", "X", "O"))).toEqual([]);
  });
});

describe("getWinningMoveIndex", () => {
  it("returns finishing move for X", () => {
    const board = b("X", "X", null, "O", "O", null, null, null, null);
    expect(getWinningMoveIndex(board, "X")).toBe(2);
  });

  it("returns finishing move for O", () => {
    const board = b("O", "O", null, "X", "X", null, null, null, null);
    expect(getWinningMoveIndex(board, "O")).toBe(2);
  });

  it("returns null when no immediate win", () => {
    const board = b("X", null, null, null, null, null, null, null, null);
    expect(getWinningMoveIndex(board, "X")).toBeNull();
  });
});
