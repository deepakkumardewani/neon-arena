import { checkDraw, checkWin, getDropRow, isColumnFull, listLegalColumns } from "./rules";
import type { Board, Connect4GameState, PlayerId } from "../types";

const COLS = 7;
const ROWS = 6;
const DEFAULT_MAX_DEPTH = 8;

// Center-first move ordering for better alpha-beta cutoffs
const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6];

const CENTER_SCORES: readonly number[] = [1, 2, 4, 6, 4, 2, 1];

function countThreats(board: Board, player: PlayerId): number {
  const DIRECTIONS: readonly [number, number][] = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  let threats = 0;

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (board[col][row] !== player) continue;

      for (const [dc, dr] of DIRECTIONS) {
        let count = 1;
        let openEnds = 0;

        for (const sign of [-1, 1] as const) {
          let c = col + dc * sign;
          let r = row + dr * sign;
          let streak = 0;
          while (c >= 0 && c < COLS && r >= 0 && r < ROWS && board[c][r] === player) {
            streak++;
            c += dc * sign;
            r += dr * sign;
          }
          count += streak;
          if (c >= 0 && c < COLS && r >= 0 && r < ROWS && board[c][r] === null) {
            openEnds++;
          }
        }

        if (count === 3 && openEnds > 0) threats++;
      }
    }
  }
  return threats;
}

function evaluate(board: Board, ai: PlayerId): number {
  const opp: PlayerId = ai === 1 ? 2 : 1;
  let score = 0;

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const cell = board[col][row];
      if (cell === ai) score += CENTER_SCORES[col];
      else if (cell === opp) score -= CENTER_SCORES[col];
    }
  }

  score += countThreats(board, ai) * 10;
  score -= countThreats(board, opp) * 10;

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  ai: PlayerId,
  lastCol: number,
  lastRow: number,
  lastPlayer: PlayerId,
): number {
  if (checkWin(board, lastCol, lastRow, lastPlayer)) {
    return lastPlayer === ai ? 100_000 + depth : -100_000 - depth;
  }
  if (checkDraw(board) || depth === 0) {
    return evaluate(board, ai);
  }

  const opp: PlayerId = ai === 1 ? 2 : 1;
  const current: PlayerId = isMaximizing ? ai : opp;

  if (isMaximizing) {
    let best = -Infinity;
    for (const col of MOVE_ORDER) {
      if (isColumnFull(board, col)) continue;
      const row = getDropRow(board, col);
      const newBoard = board.map((c, ci) =>
        ci === col ? c.map((cell, ri) => (ri === row ? current : cell)) : c,
      ) as Board;
      const score = minimax(newBoard, depth - 1, alpha, beta, false, ai, col, row, current);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of MOVE_ORDER) {
      if (isColumnFull(board, col)) continue;
      const row = getDropRow(board, col);
      const newBoard = board.map((c, ci) =>
        ci === col ? c.map((cell, ri) => (ri === row ? current : cell)) : c,
      ) as Board;
      const score = minimax(newBoard, depth - 1, alpha, beta, true, ai, col, row, current);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function chooseColumn(state: Connect4GameState, opts?: { maxDepth?: number }): number {
  const maxDepth = opts?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const ai = state.currentPlayer;
  const legal = listLegalColumns(state.board);

  let bestCol = legal[0];
  let bestScore = -Infinity;

  for (const col of MOVE_ORDER) {
    if (!legal.includes(col)) continue;
    const row = getDropRow(state.board, col);
    const newBoard = state.board.map((c, ci) =>
      ci === col ? c.map((cell, ri) => (ri === row ? ai : cell)) : c,
    ) as Board;

    // Immediate win
    if (checkWin(newBoard, col, row, ai)) return col;

    const score = minimax(newBoard, maxDepth - 1, -Infinity, Infinity, false, ai, col, row, ai);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}
