import type { PieceColor } from "@/lib/chess/types";

export const PIECE_COLORS: Record<PieceColor, { fill: string; stroke: string }> = {
  white: { fill: "var(--na-fg)", stroke: "var(--na-cyan)" },
  black: { fill: "var(--na-surface-2)", stroke: "var(--na-rose)" },
} as const;
