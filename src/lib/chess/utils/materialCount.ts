import type { PieceType } from "../types";

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

/**
 * Returns material delta from white's perspective.
 * Positive = white advantage, negative = black advantage.
 */
export function computeMaterialDelta(
  capturedByWhite: readonly PieceType[],
  capturedByBlack: readonly PieceType[],
): number {
  const whiteMaterial = capturedByWhite.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  const blackMaterial = capturedByBlack.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  return whiteMaterial - blackMaterial;
}
