import type { BoardCell, WinResult } from "@/types/game";

/** All eight winning index triples (rows, columns, diagonals). */
export const WIN_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

function lineWinner(
  board: readonly BoardCell[],
  a: number,
  b: number,
  c: number,
): "X" | "O" | null {
  const x = board[a];
  if (x === null) return null;
  if (x === board[b] && x === board[c]) return x;
  return null;
}

/** Returns win metadata or `null` if no winner yet. */
export function checkWinner(board: readonly BoardCell[]): WinResult | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const w = lineWinner(board, a, b, c);
    if (w !== null) return { winner: w, line: [...line] };
  }
  return null;
}

/** True when every cell is filled and there is no winner. */
export function isDraw(board: readonly BoardCell[]): boolean {
  if (checkWinner(board) !== null) return false;
  return board.every((cell) => cell !== null);
}

/** Indices of empty cells (any length; caller ensures 3×3 semantics). */
export function getAvailableCells(board: readonly BoardCell[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === null) out.push(i);
  }
  return out;
}

/** If `mark` can win in one move, returns that cell index; otherwise `null`. */
export function getWinningMoveIndex(board: readonly BoardCell[], mark: "X" | "O"): number | null {
  for (const i of getAvailableCells(board)) {
    const trial = [...board] as BoardCell[];
    trial[i] = mark;
    const w = checkWinner(trial);
    if (w !== null && w.winner === mark) return i;
  }
  return null;
}
