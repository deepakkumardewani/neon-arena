import type { BoardCell } from "@/types/game";

import { getAvailableCells } from "@/lib/game/logic";

/** Picks a random legal move, or `null` if the board has no empty cells. */
export function easyMove(board: readonly BoardCell[]): number | null {
  const open = getAvailableCells(board);
  if (open.length === 0) return null;
  const pick = Math.floor(Math.random() * open.length);
  return open[pick] ?? null;
}
