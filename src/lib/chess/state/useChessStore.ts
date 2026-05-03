import { create } from "zustand";
import { Chess } from "chess.js";
import type { ChessGameState, PieceColor, SquareIndex, PieceType, ChessStatus } from "../types";
import { chessReducer } from "./chessReducer";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Convert algebraic notation (e2) to square index (0-63) */
function algebraicToIndex(square: string): SquareIndex {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return rank * 8 + file;
}

/** Convert square index (0-63) to algebraic notation */
function indexToAlgebraic(index: SquareIndex): string {
  const file = String.fromCharCode("a".charCodeAt(0) + (index % 8));
  const rank = Math.floor(index / 8) + 1;
  return `${file}${rank}`;
}

/** Determine game status from chess.js instance */
function getStatusFromChess(chess: Chess): ChessStatus {
  if (chess.isCheckmate()) return "checkmate";
  if (chess.isStalemate()) return "stalemate";
  if (chess.isDraw()) return "draw";
  if (chess.isCheck()) return "check";
  return "playing";
}

/** Convert chess.js color to our PieceColor type */
function colorFromChess(color: "w" | "b"): PieceColor {
  return color === "w" ? "white" : "black";
}

interface ChessStoreState {
  state: ChessGameState;
  chess: Chess; // Not in state — mutable reference
}

interface ChessStoreActions {
  selectSquare: (square: SquareIndex) => void;
  executeMove: (from: SquareIndex, to: SquareIndex, promotion?: PieceType) => void;
  undoMove: (mode: "solo" | "local") => void;
  resolvePromotion: (piece: PieceType) => void;
  requestHint: () => void;
  clearHint: () => void;
  resetGame: () => void;
}

const initialState: ChessGameState = {
  fen: STARTING_FEN,
  history: [],
  capturedByWhite: [],
  capturedByBlack: [],
  status: "playing",
  activeColor: "white",
  promotionPending: null,
  selectedSquare: null,
  legalMoves: [],
  hintFrom: null,
  hintTo: null,
  hintTokens: 3,
};

export const useChessStore = create<ChessStoreState & ChessStoreActions>((set, get) => {
  return {
    state: initialState,
    chess: new Chess(STARTING_FEN),

    selectSquare: (square: SquareIndex) => {
      const { state, chess } = get();

      // Don't allow moves during promotion
      if (state.promotionPending !== null) {
        return;
      }

      // If selected square is a legal move target, execute the move
      if (state.legalMoves.includes(square)) {
        get().executeMove(state.selectedSquare!, square);
        return;
      }

      const squareAlgebraic = indexToAlgebraic(square);
      const piece = chess.get(squareAlgebraic as any);

      if (!piece) {
        // Empty square or nothing — clear selection
        set((store) => ({
          state: chessReducer(store.state, {
            type: "SELECT_SQUARE",
            payload: {
              square,
              legalMoves: [],
            },
          }),
        }));
        return;
      }

      const currentPlayerColor = piece.color === "w" ? "white" : "black";

      // If piece belongs to current turn, show legal moves
      if (currentPlayerColor === state.activeColor) {
        const moves = chess.moves({
          square: squareAlgebraic as any,
          verbose: true,
        });
        const legalTargets = moves.map((move: any) => algebraicToIndex(move.to as string));

        set((store) => ({
          state: chessReducer(store.state, {
            type: "SELECT_SQUARE",
            payload: {
              square,
              legalMoves: legalTargets,
            },
          }),
        }));
        return;
      }

      // Enemy piece — clear selection
      set((store) => ({
        state: chessReducer(store.state, {
          type: "SELECT_SQUARE",
          payload: {
            square,
            legalMoves: [],
          },
        }),
      }));
    },

    executeMove: (from: SquareIndex, to: SquareIndex, promotion?: PieceType) => {
      const { state, chess } = get();
      const fromAlgebraic = indexToAlgebraic(from);
      const toAlgebraic = indexToAlgebraic(to);

      // Attempt the move on chess.js
      const movePayload: any = { from: fromAlgebraic, to: toAlgebraic };
      if (promotion) {
        // Map our piece type to chess.js piece type
        const promotionMap: Record<PieceType, string> = {
          queen: "q",
          rook: "r",
          bishop: "b",
          knight: "n",
          king: "k",
          pawn: "p",
        };
        movePayload.promotion = promotionMap[promotion];
      }

      const moveResult = chess.move(movePayload);
      if (!moveResult) {
        return; // Invalid move
      }

      // Build captured pieces tracking
      const capturedByWhite = [...state.capturedByWhite];
      const capturedByBlack = [...state.capturedByBlack];

      if (moveResult.captured) {
        const capturedPiece = moveResult.captured as PieceType;
        if (moveResult.color === "w") {
          capturedByWhite.push(capturedPiece);
        } else {
          capturedByBlack.push(capturedPiece);
        }
      }

      // Check for promotion requirement
      const toPiece = chess.get(toAlgebraic as any);
      const isPawnOnBackRank =
        toPiece?.type === "p" &&
        ((toPiece.color === "w" && Math.floor(to / 8) === 7) ||
          (toPiece.color === "b" && Math.floor(to / 8) === 0));

      const promotionPending = isPawnOnBackRank ? { from, to } : null;

      const newStatus = getStatusFromChess(chess);
      const newActiveColor = colorFromChess(chess.turn());

      set((store) => ({
        state: chessReducer(store.state, {
          type: "EXECUTE_MOVE",
          payload: {
            move: {
              from,
              to,
              promotion,
              san: moveResult.san,
              captured: moveResult.captured as PieceType | undefined,
            },
            currentTurn: newActiveColor,
            status: newStatus,
            capturedByWhite,
            capturedByBlack,
            promotionPending,
          },
        }),
        chess,
      }));
    },

    undoMove: (mode: "solo" | "local") => {
      const { chess } = get();
      const movesToRemove = mode === "solo" ? 2 : 1;
      for (let i = 0; i < movesToRemove; i++) {
        chess.undo();
      }

      const newStatus = getStatusFromChess(chess);
      const newActiveColor = colorFromChess(chess.turn());

      // Reconstruct captured pieces from history
      // For now, we'll track from remaining moves; a full rebuild would require iterating history
      // This is a simplified approach — in production, you'd maintain this in state

      set((store) => ({
        state: chessReducer(store.state, {
          type: "UNDO_MOVE",
          payload: {
            currentTurn: newActiveColor,
            status: newStatus,
            movesToRemove,
          },
        }),
        chess,
      }));
    },

    resolvePromotion: (piece: PieceType) => {
      const { state } = get();
      if (!state.promotionPending) {
        return;
      }

      // Re-execute the move with the promotion piece
      get().executeMove(state.promotionPending.from, state.promotionPending.to, piece);
    },

    requestHint: () => {
      // Stub for Phase 5 — will be wired to Stockfish
      console.log("requestHint placeholder — wired in Phase 5");
    },

    clearHint: () => {
      set((store) => ({
        state: chessReducer(store.state, {
          type: "CLEAR_HINT",
        }),
      }));
    },

    resetGame: () => {
      set({
        state: initialState,
        chess: new Chess(STARTING_FEN),
      });
    },
  };
});
