import type { PieceColor } from "@/lib/chess/types";
import { PIECE_COLORS } from "../pieceTheme";

interface Props {
  color: PieceColor;
  size: number;
}

export function King({ color, size }: Props) {
  const { fill, stroke } = PIECE_COLORS[color];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Cross — vertical bar */}
      <rect
        x="18.5"
        y="5"
        width="3"
        height="11"
        rx="0.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
      {/* Cross — horizontal bar */}
      <rect
        x="14"
        y="8"
        width="12"
        height="3"
        rx="0.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
      {/* Crown band */}
      <polygon
        points="11,16 29,16 27,24 13,24"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Body */}
      <polygon
        points="12,24 28,24 30,34 10,34"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect
        x="9"
        y="34"
        width="22"
        height="4"
        rx="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
    </svg>
  );
}
