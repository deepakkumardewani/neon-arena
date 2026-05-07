import type {
  ChessGameState,
  ChessMove,
  SquareIndex,
  PieceColor,
  ChessStatus,
  PieceType,
  PromotionPending,
} from "../types";

export type ChessAction =
  | {
      type: "SELECT_SQUARE";
      payload: {
        square: SquareIndex;
        legalMoves: SquareIndex[];
      };
    }
  | {
      type: "EXECUTE_MOVE";
      payload: {
        move: ChessMove;
        currentTurn: PieceColor;
        status: ChessStatus;
        capturedByWhite: PieceType[];
        capturedByBlack: PieceType[];
        promotionPending?: PromotionPending;
      };
    }
  | {
      type: "UNDO_MOVE";
      payload: {
        currentTurn: PieceColor;
        status: ChessStatus;
        movesToRemove: number;
      };
    }
  | {
      type: "RESOLVE_PROMOTION";
      payload: {
        piece: PieceType;
      };
    }
  | {
      type: "SET_HINT";
      payload: {
        fromSquare: SquareIndex;
        toSquare: SquareIndex;
      };
    }
  | {
      type: "CLEAR_HINT";
    }
  | {
      type: "APPLY_REMOTE_STATE";
      payload: {
        fen: string;
        history: readonly ChessMove[];
        activeColor: PieceColor;
        status: ChessStatus;
        capturedByWhite: readonly PieceType[];
        capturedByBlack: readonly PieceType[];
      };
    }
  | {
      type: "RESET_GAME";
      payload: {
        initialState: ChessGameState;
      };
    };

export function chessReducer(state: ChessGameState, action: ChessAction): ChessGameState {
  switch (action.type) {
    case "SELECT_SQUARE": {
      const { square, legalMoves } = action.payload;
      // If selecting the same square, deselect (toggle off)
      if (state.selectedSquare === square) {
        return {
          ...state,
          selectedSquare: null,
          legalMoves: [],
        };
      }
      // If empty legal moves (enemy square), clear selection
      if (legalMoves.length === 0) {
        return {
          ...state,
          selectedSquare: null,
          legalMoves: [],
        };
      }
      // Otherwise, set the new selection
      return {
        ...state,
        selectedSquare: square,
        legalMoves,
      };
    }

    case "EXECUTE_MOVE": {
      const { move, currentTurn, status, capturedByWhite, capturedByBlack, promotionPending } =
        action.payload;
      return {
        ...state,
        fen: state.fen, // Will be updated by the store action
        history: [...state.history, move],
        capturedByWhite,
        capturedByBlack,
        status,
        activeColor: currentTurn,
        promotionPending: promotionPending || null,
        selectedSquare: null,
        legalMoves: [],
      };
    }

    case "UNDO_MOVE": {
      const { currentTurn, status, movesToRemove } = action.payload;
      // Remove the last N moves from history
      const newHistory = state.history.slice(0, -movesToRemove);
      return {
        ...state,
        fen: state.fen, // Will be updated by the store action
        history: newHistory,
        activeColor: currentTurn,
        status,
        selectedSquare: null,
        legalMoves: [],
      };
    }

    case "RESOLVE_PROMOTION": {
      return {
        ...state,
        promotionPending: null,
      };
    }

    case "SET_HINT": {
      const { fromSquare, toSquare } = action.payload;
      return {
        ...state,
        hintFrom: fromSquare,
        hintTo: toSquare,
        hintTokens: Math.max(0, state.hintTokens - 1),
      };
    }

    case "CLEAR_HINT": {
      return {
        ...state,
        hintFrom: null,
        hintTo: null,
      };
    }

    case "APPLY_REMOTE_STATE": {
      const { fen, history, activeColor, status, capturedByWhite, capturedByBlack } =
        action.payload;
      return {
        ...state,
        fen,
        history: [...history],
        activeColor,
        status,
        capturedByWhite: [...capturedByWhite],
        capturedByBlack: [...capturedByBlack],
        selectedSquare: null,
        legalMoves: [],
        promotionPending: null,
        hintFrom: null,
        hintTo: null,
      };
    }

    case "RESET_GAME": {
      return action.payload.initialState;
    }

    default:
      return state;
  }
}
