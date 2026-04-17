import type { BoardCell } from "@/types/game";

import { easyMove } from "@/lib/ai/easy";
import { getWinningMoveIndex } from "@/lib/game/logic";

const otherMark = (mark: "X" | "O"): "X" | "O" => (mark === "X" ? "O" : "X");

/**
 * Win if possible, else block opponent win, else random legal move.
 * Returns `null` only when the board is full.
 */
export function mediumMove(board: readonly BoardCell[], aiMark: "X" | "O"): number | null {
  const finish = getWinningMoveIndex(board, aiMark);
  if (finish !== null) return finish;
  const block = getWinningMoveIndex(board, otherMark(aiMark));
  if (block !== null) return block;
  return easyMove(board);
}
