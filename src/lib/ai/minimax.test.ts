import { describe, expect, it } from "vite-plus/test";

import { hardMove } from "@/lib/ai/minimax";
import { checkWinner, getAvailableCells, isDraw } from "@/lib/game/logic";
import type { BoardCell } from "@/types/game";

const empty = (): BoardCell[] => [null, null, null, null, null, null, null, null, null];

const opponent = (m: "X" | "O"): "X" | "O" => (m === "X" ? "O" : "X");

function randomElement<T>(items: readonly T[]): T {
  const i = Math.floor(Math.random() * items.length);
  const v = items[i];
  if (v === undefined) throw new Error("empty choice");
  return v;
}

/** Random legal reply (not necessarily optimal). */
function randomMove(board: BoardCell[]): number {
  return randomElement(getAvailableCells(board));
}

/**
 * Play out a game: `aiMark` uses `hardMove`, the opponent replies randomly.
 * Returns the outcome from the AI's perspective.
 */
function simulateRandomOpponent(aiMark: "X" | "O", rounds: number): void {
  for (let r = 0; r < rounds; r += 1) {
    const board = empty();
    let turn: "X" | "O" = "X";
    while (true) {
      const w = checkWinner(board);
      if (w !== null) {
        expect(w.winner).not.toBe(opponent(aiMark));
        break;
      }
      if (isDraw(board)) break;

      const player: "X" | "O" = turn;
      const idx = player === aiMark ? hardMove(board, aiMark) : randomMove(board);
      if (idx === null) break;
      if (board[idx] !== null) throw new Error("illegal move");
      board[idx] = player;
      turn = opponent(player);
    }
  }
}

describe("hardMove", () => {
  it("returns null on full board", () => {
    const board: BoardCell[] = ["X", "O", "X", "O", "X", "X", "O", "X", "O"];
    expect(hardMove(board, "X")).toBeNull();
  });

  it("always takes an available winning move", () => {
    const board = empty();
    board[0] = "O";
    board[1] = "O";
    expect(hardMove(board, "O")).toBe(2);
  });

  it("always blocks an opponent one move from winning", () => {
    const board = empty();
    board[0] = "X";
    board[1] = "X";
    expect(hardMove(board, "O")).toBe(2);
  });

  it("never loses against a random opponent from empty start (AI as O)", () => {
    simulateRandomOpponent("O", 40);
  });

  it("never loses against a random opponent from empty start (AI as X)", () => {
    simulateRandomOpponent("X", 25);
  });

  it("self-play (hard X vs hard O) always ends in a draw from empty board", () => {
    const board = empty();
    let turn: "X" | "O" = "X";
    while (checkWinner(board) === null && !isDraw(board)) {
      const idx = hardMove(board, turn);
      expect(idx).not.toBeNull();
      if (idx === null) break;
      expect(board[idx]).toBeNull();
      board[idx] = turn;
      turn = opponent(turn);
    }
    expect(checkWinner(board)).toBeNull();
    expect(isDraw(board)).toBe(true);
  });
});
