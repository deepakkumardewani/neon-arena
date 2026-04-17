import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { mediumMove } from "@/lib/ai/medium";
import type { BoardCell } from "@/types/game";

const empty = (): BoardCell[] => [null, null, null, null, null, null, null, null, null];

describe("mediumMove", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null on a full board", () => {
    const board: BoardCell[] = ["X", "O", "X", "O", "X", "X", "O", "X", "O"];
    expect(mediumMove(board, "X")).toBeNull();
  });

  it("takes immediate winning move for X", () => {
    const board = empty();
    board[0] = "X";
    board[1] = "X";
    expect(mediumMove(board, "X")).toBe(2);
  });

  it("takes immediate winning move for O", () => {
    const board = empty();
    board[3] = "O";
    board[4] = "O";
    expect(mediumMove(board, "O")).toBe(5);
  });

  it("blocks opponent winning move", () => {
    const board = empty();
    board[0] = "X";
    board[1] = "X";
    expect(mediumMove(board, "O")).toBe(2);
  });

  it("falls back to random legal move when no win or block", () => {
    const board = empty();
    board[0] = "X";
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(mediumMove(board, "O")).toBe(1);
  });
});
