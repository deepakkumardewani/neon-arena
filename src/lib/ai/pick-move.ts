import type { BoardCell, Difficulty } from "@/types/game";

import { easyMove } from "@/lib/ai/easy";
import { hardMove } from "@/lib/ai/minimax";
import { mediumMove } from "@/lib/ai/medium";

/** Chooses the AI cell index for the current `aiMark` and difficulty. */
export function pickAiMove(
  board: readonly BoardCell[],
  difficulty: Difficulty,
  aiMark: "X" | "O",
): number | null {
  if (difficulty === "easy") return easyMove(board);
  if (difficulty === "hard") return hardMove(board, aiMark);
  return mediumMove(board, aiMark);
}
