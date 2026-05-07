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
  postMoveCallback: ((state: ChessGameState) => void) | null;
}

interface ChessStoreActions {
  selectSquare: (square: SquareIndex) => void;
  executeMove: (from: SquareIndex, to: SquareIndex, promotion?: PieceType) => void;
  undoMove: (mode: "solo" | "local") => void;
  resolvePromotion: (piece: PieceType) => void;
  /** Apply a hint UCI move (e.g. "e2e4") to the store state. Called by GamePage after Stockfish responds. */
  applyHint: (uciMove: string) => void;
  clearHint: () => void;
  resetGame: () => void;
  /** Apply remote state from Firestore snapshot (online/friend modes). */
  applyRemoteState: (payload: {
    fen: string;
    history: readonly import("../types").ChessMove[];
    activeColor: import("../types").PieceColor;
    status: import("../types").ChessStatus;
    capturedByWhite: readonly import("../types").PieceType[];
    capturedByBlack: readonly import("../types").PieceType[];
  }) => void;
  /** Register a callback invoked after executeMove or resolvePromotion completes. Used for online Firestore writes. */
  setPostMoveCallback: (cb: ((state: ChessGameState) => void) | null) => void;
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
  enPassantSquare: null,
};

export const useChessStore = create<ChessStoreState & ChessStoreActions>((set, get) => {
  return {
    state: initialState,
    chess: new Chess(STARTING_FEN),
    postMoveCallback: null,

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

      // Detect promotion intent BEFORE calling chess.js — a pawn on the 7th rank (white)
      // or 2nd rank (black) moving to the back rank requires a promotion piece.
      // If none is provided, gate on promotionPending instead of letting chess.js reject.
      if (!promotion) {
        const movingPiece = chess.get(fromAlgebraic as any);
        const isPromotionMove =
          movingPiece?.type === "p" &&
          ((movingPiece.color === "w" && Math.floor(to / 8) === 7) ||
            (movingPiece.color === "b" && Math.floor(to / 8) === 0));

        if (isPromotionMove) {
          set((store) => ({
            state: {
              ...store.state,
              promotionPending: { from, to },
              selectedSquare: null,
              legalMoves: [],
            },
          }));
          return;
        }
      }

      // Attempt the move on chess.js
      const promotionMap: Record<PieceType, string> = {
        queen: "q",
        rook: "r",
        bishop: "b",
        knight: "n",
        king: "k",
        pawn: "p",
      };
      const movePayload: any = { from: fromAlgebraic, to: toAlgebraic };
      if (promotion) {
        movePayload.promotion = promotionMap[promotion];
      }

      const moveResult = chess.move(movePayload);
      if (!moveResult) {
        return; // Invalid move
      }

      // Detect en passant captured pawn square
      let enPassantSquare: SquareIndex | null = null;
      if (moveResult.flags.includes("e")) {
        // The captured pawn is on the destination file, source rank
        enPassantSquare = (to % 8) + (from - (from % 8));
      }

      // Build captured pieces tracking
      const capturedByWhite = [...state.capturedByWhite];
      const capturedByBlack = [...state.capturedByBlack];

      if (moveResult.captured) {
        const CHESS_JS_PIECE_MAP: Record<string, PieceType> = {
          k: "king",
          q: "queen",
          r: "rook",
          b: "bishop",
          n: "knight",
          p: "pawn",
        };
        const capturedPiece = CHESS_JS_PIECE_MAP[moveResult.captured];
        if (capturedPiece) {
          if (moveResult.color === "w") {
            capturedByWhite.push(capturedPiece);
          } else {
            capturedByBlack.push(capturedPiece);
          }
        }
      }

      const promotionPending = null;

      const newStatus = getStatusFromChess(chess);
      const newActiveColor = colorFromChess(chess.turn());

      const newFen = chess.fen();

      set((store) => {
        const nextState = chessReducer(store.state, {
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
        });
        const finalState = { ...nextState, fen: newFen, enPassantSquare };
        store.postMoveCallback?.(finalState);
        return { state: finalState, chess };
      });

      // Clear en passant highlight after 100ms
      if (enPassantSquare !== null) {
        setTimeout(() => {
          set((s) => ({ state: { ...s.state, enPassantSquare: null } }));
        }, 100);
      }
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

      const fenAfterUndo = chess.fen();

      set((store) => {
        const nextState = chessReducer(store.state, {
          type: "UNDO_MOVE",
          payload: {
            currentTurn: newActiveColor,
            status: newStatus,
            movesToRemove,
          },
        });
        return { state: { ...nextState, fen: fenAfterUndo }, chess };
      });
    },

    resolvePromotion: (piece: PieceType) => {
      const { state } = get();
      if (!state.promotionPending) {
        return;
      }

      // Re-execute the move with the promotion piece
      get().executeMove(state.promotionPending.from, state.promotionPending.to, piece);
    },

    applyHint: (uciMove: string) => {
      const { state } = get();
      if (state.hintTokens <= 0) return;

      // Parse UCI move string (e.g. "e2e4") into square indices
      const fromAlg = uciMove.slice(0, 2);
      const toAlg = uciMove.slice(2, 4);
      const fromSquare = algebraicToIndex(fromAlg);
      const toSquare = algebraicToIndex(toAlg);

      set((store) => ({
        state: chessReducer(store.state, {
          type: "SET_HINT",
          payload: { fromSquare, toSquare },
        }),
      }));
    },

    clearHint: () => {
      set((store) => ({
        state: chessReducer(store.state, {
          type: "CLEAR_HINT",
        }),
      }));
    },

    applyRemoteState: (payload) => {
      const { fen, history, activeColor, status, capturedByWhite, capturedByBlack } = payload;
      const newChess = new Chess(fen);
      set({
        state: chessReducer(get().state, {
          type: "APPLY_REMOTE_STATE",
          payload: {
            fen,
            history,
            activeColor,
            status,
            capturedByWhite,
            capturedByBlack,
          },
        }),
        chess: newChess,
      });
    },

    setPostMoveCallback: (cb) => {
      set({ postMoveCallback: cb });
    },

    resetGame: () => {
      set({
        state: initialState,
        chess: new Chess(STARTING_FEN),
        postMoveCallback: null,
      });
    },
  };
});
