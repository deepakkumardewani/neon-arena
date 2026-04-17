import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { easyMove } from "@/lib/ai/easy";
import type { BoardCell } from "@/types/game";

const empty = (): BoardCell[] => [null, null, null, null, null, null, null, null, null];

describe("easyMove", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null on a full board", () => {
    const board: BoardCell[] = ["X", "O", "X", "O", "X", "X", "O", "X", "O"];
    expect(easyMove(board)).toBeNull();
  });

  it("returns only an available index", () => {
    const board = empty();
    board[0] = "X";
    board[1] = "O";
    const open = [2, 3, 4, 5, 6, 7, 8];
    for (let k = 0; k < 30; k += 1) {
      const m = easyMove(board);
      expect(m).not.toBeNull();
      expect(open).toContain(m);
    }
  });

  it("respects Math.random selection deterministically", () => {
    const board = empty();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const m = easyMove(board);
    expect(m).toBe(8);
  });
});
