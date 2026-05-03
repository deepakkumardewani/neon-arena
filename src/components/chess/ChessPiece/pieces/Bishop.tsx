import type { PieceColor } from "@/lib/chess/types";
import { PIECE_COLORS } from "../pieceTheme";

interface Props {
  color: PieceColor;
  size: number;
}

export function Bishop({ color, size }: Props) {
  const { fill, stroke } = PIECE_COLORS[color];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Tip orb */}
      <circle cx="20" cy="8" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Hat body */}
      <polygon
        points="20,11 26,26 14,26"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Collar */}
      <rect
        x="12"
        y="26"
        width="16"
        height="3"
        rx="0.5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* Lower body */}
      <polygon
        points="13,29 27,29 29,35 11,35"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
