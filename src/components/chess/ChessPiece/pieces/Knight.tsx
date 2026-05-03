import type { PieceColor } from "@/lib/chess/types";
import { PIECE_COLORS } from "../pieceTheme";

interface Props {
  color: PieceColor;
  size: number;
}

export function Knight({ color, size }: Props) {
  const { fill, stroke } = PIECE_COLORS[color];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Horse head silhouette — angular/geometric */}
      <polygon
        points="15,34 15,23 11,18 14,10 21,7 28,11 27,18 23,21 23,34"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Eye */}
      <circle cx="22.5" cy="11.5" r="1.5" fill={stroke} />
      {/* Nostril notch */}
      <circle cx="15.5" cy="19" r="1" fill={stroke} />
      {/* Base */}
      <rect
        x="9"
        y="34"
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
