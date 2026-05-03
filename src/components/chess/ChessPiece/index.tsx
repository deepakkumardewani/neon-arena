import type { ChessPiece as ChessPieceType } from "@/lib/chess/types";
import { King } from "./pieces/King";
import { Queen } from "./pieces/Queen";
import { Rook } from "./pieces/Rook";
import { Bishop } from "./pieces/Bishop";
import { Knight } from "./pieces/Knight";
import { Pawn } from "./pieces/Pawn";

interface Props {
  piece: ChessPieceType;
  size?: number;
  className?: string;
}

export function ChessPiece({ piece, size = 40, className }: Props) {
  const props = { color: piece.color, size };
  const Component = {
    king: King,
    queen: Queen,
    rook: Rook,
    bishop: Bishop,
    knight: Knight,
    pawn: Pawn,
  }[piece.type];

  return (
    <span className={className} aria-label={`${piece.color} ${piece.type}`}>
      <Component {...props} />
    </span>
  );
}
