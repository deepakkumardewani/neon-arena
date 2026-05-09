import { checkWin, dropDisc, getDropRow, listLegalColumns } from "./rules";
import type { Connect4GameState, PlayerId } from "../types";

const CENTER_WEIGHT: readonly number[] = [1, 2, 4, 6, 4, 2, 1];

function canWin(state: Connect4GameState, player: PlayerId, col: number): boolean {
  const row = getDropRow(state.board, col);
  if (row === -1) return false;
  const boardAfter = dropDisc({ ...state, currentPlayer: player }, col).board;
  return checkWin(boardAfter, col, row, player) !== null;
}

export function chooseColumn(state: Connect4GameState): number {
  const legal = listLegalColumns(state.board);
  const ai = state.currentPlayer;
  const opponent: PlayerId = ai === 1 ? 2 : 1;

  const winCol = legal.find((col) => canWin(state, ai, col));
  if (winCol !== undefined) return winCol;

  const blockCol = legal.find((col) => canWin(state, opponent, col));
  if (blockCol !== undefined) return blockCol;

  return legal.reduce((best, col) => (CENTER_WEIGHT[col] > CENTER_WEIGHT[best] ? col : best));
}
