import type { PieceColor } from "@/lib/chess/types";
import { PIECE_COLORS } from "../pieceTheme";

interface Props {
  color: PieceColor;
  size?: number;
}

export function Queen({ color, size }: Props) {
  const { fill, stroke } = PIECE_COLORS[color];
  return (
    <svg width={size ?? "100%"} height={size ?? "100%"} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Crown orbs */}
      <circle cx="20" cy="8" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <circle cx="11" cy="12" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <circle cx="29" cy="12" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Crown band */}
      <polygon
        points="9,15 31,15 29,23 11,23"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Body */}
      <polygon
        points="12,23 28,23 30,33 10,33"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect
        x="9"
        y="33"
        width="22"
        height="4"
        rx="1.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}
