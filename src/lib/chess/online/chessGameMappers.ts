import type { GameDoc, GameDocPlayer } from "@/types/firebase";
import type { ChessMove, ChessStatus, PieceColor, PieceType } from "@/lib/chess/types";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface RemoteChessState {
  readonly fen: string;
  readonly history: readonly ChessMove[];
  readonly activeColor: PieceColor;
  readonly status: ChessStatus;
  readonly capturedByWhite: readonly PieceType[];
  readonly capturedByBlack: readonly PieceType[];
  readonly winner: PieceColor | null;
}

export interface CommitMovePayload {
  readonly fen: string;
  readonly history: readonly string[];
  readonly currentTurn: string;
  readonly lastMoveAt: number;
}

function playerIdentity(p: GameDocPlayer): string {
  return p.queueEntryId ?? p.uid;
}

function playerColor(doc: GameDoc, identity: string): PieceColor | null {
  if (identity === playerIdentity(doc.playerX)) return "white";
  if (doc.playerO !== null && identity === playerIdentity(doc.playerO)) return "black";
  return null;
}

function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string");
}

function readPieceTypeArray(raw: unknown): PieceType[] {
  const PIECE_TYPES: PieceType[] = ["king", "queen", "rook", "bishop", "knight", "pawn"];
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is PieceType => PIECE_TYPES.includes(v as PieceType));
}

function fenToActiveColor(fen: string): PieceColor {
  const parts = fen.split(" ");
  return parts.length >= 2 && parts[1] === "b" ? "black" : "white";
}

function deriveStatusFromDoc(docStatus: string): ChessStatus {
  if (docStatus === "waiting" || docStatus === "active") return "playing";
  return "playing";
}

export function chessDocToGameState(
  doc: GameDoc,
  opts?: { winsAs?: PieceColor },
): RemoteChessState {
  const fen = typeof doc.fen === "string" && doc.fen.length > 0 ? doc.fen : STARTING_FEN;
  const sanHistory = readStringArray(doc.moveHistory);
  const capturedByWhite = readPieceTypeArray(doc.capturedByWhite);
  const capturedByBlack = readPieceTypeArray(doc.capturedByBlack);

  // Build ChessMove array from SAN history (minimal — just SAN strings, no from/to needed for remote sync)
  const history: ChessMove[] = sanHistory.map((san) => ({
    from: -1,
    to: -1,
    san,
  }));

  // Handle disconnect override (winsAs means this player wins by disconnect)
  if (opts?.winsAs) {
    return {
      fen,
      history,
      activeColor: opts.winsAs,
      status: "resigned",
      capturedByWhite,
      capturedByBlack,
      winner: opts.winsAs,
    };
  }

  // Handle expired/abandoned
  if (
    doc.status === "expired" ||
    doc.status === "abandoned" ||
    (doc.expiresAt > 0 && Date.now() > doc.expiresAt)
  ) {
    return {
      fen,
      history,
      activeColor: "white",
      status: "abandoned",
      capturedByWhite,
      capturedByBlack,
      winner: null,
    };
  }

  // Handle waiting (friend mode before opponent joins)
  if (doc.status === "waiting") {
    return {
      fen,
      history,
      activeColor: "white",
      status: "playing",
      capturedByWhite,
      capturedByBlack,
      winner: null,
    };
  }

  const activeColor = fenToActiveColor(fen);
  const checkStatus = deriveStatusFromDoc(doc.status);

  // Handle finished game
  if (doc.status === "finished") {
    if (doc.winner === "draw") {
      return {
        fen,
        history,
        activeColor,
        status: "draw",
        capturedByWhite,
        capturedByBlack,
        winner: null,
      };
    }
    if (typeof doc.winner === "string" && doc.winner.length > 0) {
      const winnerColor = playerColor(doc, doc.winner) ?? "white";
      return {
        fen,
        history,
        activeColor,
        status: "checkmate",
        capturedByWhite,
        capturedByBlack,
        winner: winnerColor,
      };
    }
  }

  return {
    fen,
    history,
    activeColor,
    status: checkStatus,
    capturedByWhite,
    capturedByBlack,
    winner: null,
  };
}

export function commitMovePayload(
  fen: string,
  history: readonly string[],
  currentTurn: string,
): CommitMovePayload {
  return {
    fen,
    history: [...history],
    currentTurn,
    lastMoveAt: Date.now(),
  };
}
