import { describe, expect, it } from "vitest";
import { chooseColumn } from "./aiEasy";
import { createInitialState, isColumnFull } from "./rules";
import type { Board, CellValue } from "../types";

function makeBoard(cols: CellValue[][]): Board {
  return cols as Board;
}

describe("aiEasy.chooseColumn", () => {
  it("returns a legal column on an empty board", () => {
    const state = createInitialState();
    const col = chooseColumn({ ...state, status: "playing" });
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThanOrEqual(6);
  });

  it("never picks a full column", () => {
    const full: CellValue[] = [1, 2, 1, 2, 1, 2];
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) => (i < 6 ? [...full] : Array(6).fill(null))),
    );
    const state = { ...createInitialState(), board, status: "playing" as const };
    for (let i = 0; i < 20; i++) {
      const col = chooseColumn(state);
      expect(isColumnFull(board, col)).toBe(false);
    }
  });

  it("returns the only legal column on a near-full board", () => {
    const full: CellValue[] = [1, 2, 1, 2, 1, 2];
    const board = makeBoard(
      Array.from({ length: 7 }, (_, i) => (i !== 3 ? [...full] : Array(6).fill(null))),
    );
    const state = { ...createInitialState(), board, status: "playing" as const };
    expect(chooseColumn(state)).toBe(3);
  });
});
