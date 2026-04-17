import type { BoardCell } from "@/types/game";

import { checkWinner, getAvailableCells, isDraw } from "@/lib/game/logic";

const opponentOf = (mark: "X" | "O"): "X" | "O" => (mark === "X" ? "O" : "X");

function minimaxScore(
  board: readonly BoardCell[],
  depth: number,
  isMaximizing: boolean,
  aiMark: "X" | "O",
  alpha: number,
  beta: number,
): number {
  const win = checkWinner(board);
  if (win !== null) {
    return win.winner === aiMark ? 10 - depth : depth - 10;
  }
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let value = Number.NEGATIVE_INFINITY;
    const mark = aiMark;
    for (const i of getAvailableCells(board)) {
      const next = [...board] as BoardCell[];
      next[i] = mark;
      const score = minimaxScore(next, depth + 1, false, aiMark, alpha, beta);
      value = Math.max(value, score);
      if (value >= beta) return value;
      alpha = Math.max(alpha, value);
    }
    return value;
  }

  let value = Number.POSITIVE_INFINITY;
  const mark = opponentOf(aiMark);
  for (const i of getAvailableCells(board)) {
    const next = [...board] as BoardCell[];
    next[i] = mark;
    const score = minimaxScore(next, depth + 1, true, aiMark, alpha, beta);
    value = Math.min(value, score);
    if (value <= alpha) return value;
    beta = Math.min(beta, value);
  }
  return value;
}

/**
 * Optimal move for `aiMark` using minimax with alpha–beta pruning.
 * Unbeatable on standard 3×3 from any non-terminal state.
 */
export function hardMove(board: readonly BoardCell[], aiMark: "X" | "O"): number | null {
  const moves = getAvailableCells(board);
  if (moves.length === 0) return null;

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: number[] = [];

  for (const i of moves) {
    const next = [...board] as BoardCell[];
    next[i] = aiMark;
    const score = minimaxScore(next, 0, false, aiMark, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [i];
    } else if (score === bestScore) {
      bestMoves.push(i);
    }
  }

  if (bestMoves.length === 0) return null;
  const pick = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[pick] ?? null;
}
