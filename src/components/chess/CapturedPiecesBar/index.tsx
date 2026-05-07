import type { PieceColor, PieceType } from "@/lib/chess/types";
import { useChessStore } from "@/lib/chess/state/useChessStore";
import { ChessPiece } from "@/components/chess/ChessPiece";
import { computeMaterialDelta } from "@/lib/chess/utils/materialCount";

const PIECE_ORDER: PieceType[] = ["queen", "rook", "bishop", "knight", "pawn"];

function sortedCaptures(pieces: readonly PieceType[]): PieceType[] {
  return [...pieces].sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b));
}

interface CaptureRowProps {
  pieces: readonly PieceType[];
  color: PieceColor;
  delta: number;
  showDelta: boolean;
}

function CaptureRow({ pieces, color, delta, showDelta }: CaptureRowProps) {
  const sorted = sortedCaptures(pieces);
  return (
    <div className="flex min-h-[28px] flex-wrap items-center gap-x-0.5 gap-y-0.5">
      {sorted.map((type, i) => (
        <ChessPiece
          key={`${type}-${i}`}
          piece={{ type, color }}
          size={20}
          className="inline-flex"
        />
      ))}
      {showDelta && Math.abs(delta) > 0 && (
        <span
          className="ml-1 text-xs font-bold tabular-nums"
          style={{ color: delta > 0 ? "var(--na-cyan)" : "var(--na-rose)" }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}

interface Props {
  show?: boolean;
}

export function CapturedPiecesBar({ show = true }: Props) {
  const capturedByWhite = useChessStore((s) => s.state.capturedByWhite);
  const capturedByBlack = useChessStore((s) => s.state.capturedByBlack);

  if (!show) return null;

  const delta = computeMaterialDelta(capturedByWhite, capturedByBlack);

  return (
    <div className="flex flex-col gap-1 px-1">
      {/* White's captures (black pieces white captured) */}
      <CaptureRow pieces={capturedByWhite} color="black" delta={delta} showDelta={delta > 0} />
      {/* Black's captures (white pieces black captured) */}
      <CaptureRow pieces={capturedByBlack} color="white" delta={-delta} showDelta={delta < 0} />
    </div>
  );
}
