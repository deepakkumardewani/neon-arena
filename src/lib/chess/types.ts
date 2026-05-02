export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type PieceColor = "white" | "black";

export interface ChessPiece {
  readonly type: PieceType;
  readonly color: PieceColor;
}

/** Square index 0–63, a1=0, h8=63 (little-endian rank). */
export type SquareIndex = number;

export interface ChessMove {
  readonly from: SquareIndex;
  readonly to: SquareIndex;
  readonly promotion?: PieceType;
  readonly san: string;
  readonly captured?: PieceType;
}

export type ChessStatus =
  | "idle"
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resigned"
  | "abandoned";

export type PromotionPending = {
  readonly from: SquareIndex;
  readonly to: SquareIndex;
} | null;

export interface ChessGameState {
  readonly fen: string;
  readonly history: readonly ChessMove[];
  readonly capturedByWhite: readonly PieceType[];
  readonly capturedByBlack: readonly PieceType[];
  readonly status: ChessStatus;
  readonly activeColor: PieceColor;
  readonly promotionPending: PromotionPending;
  readonly selectedSquare: SquareIndex | null;
  readonly legalMoves: readonly SquareIndex[];
  readonly hintFrom: SquareIndex | null;
  readonly hintTo: SquareIndex | null;
  readonly hintTokens: number;
}

export interface ChessSettings {
  readonly showMoveHistory: boolean;
  readonly showCapturedPieces: boolean;
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number;
}
