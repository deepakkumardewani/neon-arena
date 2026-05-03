import type { PieceColor } from "@/lib/chess/types";
import { PIECE_COLORS } from "../pieceTheme";

interface Props {
  color: PieceColor;
  size: number;
}

export function Rook({ color, size }: Props) {
  const { fill, stroke } = PIECE_COLORS[color];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Battlements */}
      <rect
        x="10"
        y="7"
        width="5"
        height="7"
        rx="0.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <rect
        x="17.5"
        y="7"
        width="5"
        height="7"
        rx="0.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <rect
        x="25"
        y="7"
        width="5"
        height="7"
        rx="0.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* Body */}
      <rect x="11" y="14" width="18" height="13" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Base */}
      <rect
        x="9"
        y="27"
        width="22"
        height="7"
        rx="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}
