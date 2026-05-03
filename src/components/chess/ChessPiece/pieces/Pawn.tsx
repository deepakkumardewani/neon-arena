import type { PieceColor } from "@/lib/chess/types";
import { PIECE_COLORS } from "../pieceTheme";

interface Props {
  color: PieceColor;
  size: number;
}

export function Pawn({ color, size }: Props) {
  const { fill, stroke } = PIECE_COLORS[color];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Head */}
      <circle cx="20" cy="10" r="5.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Neck */}
      <polygon
        points="17,15.5 23,15.5 24,20 16,20"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Body */}
      <polygon
        points="14,20 26,20 28,30 12,30"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect
        x="10"
        y="30"
        width="20"
        height="5"
        rx="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}
