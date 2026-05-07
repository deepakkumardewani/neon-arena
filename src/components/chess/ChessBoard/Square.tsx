import type { ChessPiece as ChessPieceType, SquareIndex } from "@/lib/chess/types";
import { ChessPiece } from "../ChessPiece";

interface Props {
  index: SquareIndex;
  piece: ChessPieceType | null;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isHintFrom: boolean;
  isHintTo: boolean;
  isInCheck: boolean;
  isEnPassant?: boolean;
  onClick: (index: SquareIndex) => void;
  onPointerDown?: (e: React.PointerEvent, index: SquareIndex) => void;
}

export function Square({
  index,
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isLastMoveFrom,
  isLastMoveTo,
  isHintFrom,
  isHintTo,
  isInCheck,
  isEnPassant = false,
  onClick,
  onPointerDown,
}: Props) {
  const baseColor = isLight ? "var(--na-board-light)" : "var(--na-board-dark)";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`square ${index}`}
      aria-pressed={isSelected}
      onClick={() => onClick(index)}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, index) : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(index);
      }}
      className="relative flex cursor-pointer items-center justify-center select-none"
      style={{ backgroundColor: baseColor, aspectRatio: "1" }}
    >
      {/* Layer 2: last move tint */}
      {(isLastMoveFrom || isLastMoveTo) && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: "color-mix(in oklch, var(--na-purple) 28%, transparent)",
          }}
        />
      )}

      {/* Layer 3: selected glow */}
      {isSelected && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              "inset 0 0 0 2px var(--na-cyan), inset 0 0 8px color-mix(in oklch, var(--na-cyan) 40%, transparent)",
            backgroundColor: "color-mix(in oklch, var(--na-cyan) 12%, transparent)",
          }}
        />
      )}

      {/* Layer 4: legal move indicators */}
      {isLegalMove && !piece && (
        <span
          className="pointer-events-none absolute"
          style={{
            width: "28%",
            height: "28%",
            borderRadius: "50%",
            backgroundColor: "color-mix(in oklch, var(--na-cyan) 50%, transparent)",
          }}
        />
      )}
      {isLegalMove && piece && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 0 0 3px color-mix(in oklch, var(--na-cyan) 70%, transparent)",
          }}
        />
      )}

      {/* Layer 5: hint highlights */}
      {isHintFrom && <span className="na-hint-pulse pointer-events-none absolute inset-0" />}
      {isHintTo && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: "color-mix(in oklch, var(--na-rose) 35%, transparent)",
            boxShadow: "inset 0 0 0 2px var(--na-rose)",
          }}
        />
      )}

      {/* Layer 6: check flash */}
      {isInCheck && <span className="na-check-flash pointer-events-none absolute inset-0" />}

      {/* En passant captured pawn highlight */}
      {isEnPassant && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: "color-mix(in oklch, var(--na-rose) 40%, transparent)",
            boxShadow: "inset 0 0 0 2px var(--na-rose)",
          }}
        />
      )}

      {/* Layer 7: piece */}
      {piece && (
        <span className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center p-[6%]">
          <ChessPiece piece={piece} size={40} className="h-full w-full" />
        </span>
      )}
    </div>
  );
}
