import type { DocumentData } from "firebase/firestore";

import { checkWinner } from "@/lib/game/logic";
import type { GameDoc } from "@/types/firebase";
import type { BoardCell, GameStatus } from "@/types/game";

export interface RemoteSyncPayload {
  readonly board: BoardCell[];
  readonly currentTurn: "X" | "O";
  readonly status: GameStatus;
  readonly winner: "X" | "O" | null;
  readonly winLine: readonly number[] | null;
}

function readBoard(raw: DocumentData["board"]): BoardCell[] {
  if (!Array.isArray(raw) || raw.length !== 9) {
    return [null, null, null, null, null, null, null, null, null];
  }
  const out: BoardCell[] = [];
  for (let i = 0; i < 9; i += 1) {
    const c = raw[i];
    if (c === "X" || c === "O") out.push(c);
    else out.push(null);
  }
  return out;
}

function readPlayer(
  raw: DocumentData,
  key: "playerX" | "playerO",
): { uid: string; nickname: string } | null {
  const p = raw[key];
  if (p === null || p === undefined || typeof p !== "object") return null;
  const o = p as Record<string, string>;
  const uid = typeof o.uid === "string" ? o.uid : "";
  const nickname = typeof o.nickname === "string" ? o.nickname : "Player";
  if (uid === "") return null;
  return { uid, nickname };
}

export function firestoreDataToGameDoc(id: string, data: DocumentData): GameDoc {
  const playerX = readPlayer(data, "playerX");
  if (playerX === null) {
    throw new Error("Invalid game: playerX missing");
  }
  const playerO = readPlayer(data, "playerO");
  const board = readBoard(data.board);
  const currentTurn =
    typeof data.currentTurn === "string" && data.currentTurn.length > 0
      ? data.currentTurn
      : playerX.uid;
  const statusRaw = data.status;
  const status =
    statusRaw === "waiting" ||
    statusRaw === "active" ||
    statusRaw === "finished" ||
    statusRaw === "abandoned" ||
    statusRaw === "expired"
      ? statusRaw
      : "waiting";
  const winner = typeof data.winner === "string" || data.winner === null ? data.winner : null;
  const createdAt = typeof data.createdAt === "number" ? data.createdAt : 0;
  const expiresAt = typeof data.expiresAt === "number" ? data.expiresAt : 0;
  const disconnectedAt = typeof data.disconnectedAt === "number" ? data.disconnectedAt : null;
  const disconnectedBy = typeof data.disconnectedBy === "string" ? data.disconnectedBy : null;
  const rematchRaw = data.rematch;
  const rematch =
    rematchRaw !== null && typeof rematchRaw === "object" && !Array.isArray(rematchRaw)
      ? { ...(rematchRaw as Record<string, boolean>) }
      : {};
  let nextGameId: string | null | undefined;
  if (typeof data.nextGameId === "string") nextGameId = data.nextGameId;
  else if (data.nextGameId === null) nextGameId = null;
  else nextGameId = undefined;
  const rematchDeclined = Boolean(data.rematchDeclined);
  const rematchDeclinedBy =
    typeof data.rematchDeclinedBy === "string" ? data.rematchDeclinedBy : undefined;

  return {
    gameId: typeof data.gameId === "string" ? data.gameId : id,
    playerX,
    playerO,
    board,
    currentTurn,
    status,
    winner,
    createdAt,
    expiresAt,
    disconnectedAt,
    disconnectedBy,
    rematch,
    nextGameId,
    rematchDeclined,
    rematchDeclinedBy,
  };
}

function turnUidToMark(uid: string, doc: GameDoc): "X" | "O" | null {
  if (uid === doc.playerX.uid) return "X";
  if (doc.playerO !== null && uid === doc.playerO.uid) return "O";
  return null;
}

function winnerUidToMark(w: string | null, doc: GameDoc): "X" | "O" | null {
  if (w === null || w === "draw") return null;
  return turnUidToMark(w, doc);
}

export function gameDocToRemoteSync(
  docSnap: GameDoc,
  disconnectOverride?: { winsAs: "X" | "O" },
): RemoteSyncPayload {
  const board = [...docSnap.board] as BoardCell[];

  if (disconnectOverride !== undefined) {
    const win = checkWinner(board);
    return {
      board,
      currentTurn: disconnectOverride.winsAs,
      status: "win",
      winner: disconnectOverride.winsAs,
      winLine: win?.line ?? null,
    };
  }

  if (
    docSnap.status === "expired" ||
    docSnap.status === "abandoned" ||
    (docSnap.expiresAt > 0 && Date.now() > docSnap.expiresAt)
  ) {
    return {
      board,
      currentTurn: "X",
      status: "idle",
      winner: null,
      winLine: null,
    };
  }

  if (docSnap.status === "waiting") {
    return {
      board,
      currentTurn: "X",
      status: "idle",
      winner: null,
      winLine: null,
    };
  }

  const turnMark = turnUidToMark(docSnap.currentTurn, docSnap);
  const currentTurn = turnMark ?? "X";

  if (docSnap.status === "finished") {
    const w = winnerUidToMark(docSnap.winner, docSnap);
    if (docSnap.winner === "draw" || w === null) {
      return {
        board,
        currentTurn,
        status: "draw",
        winner: null,
        winLine: null,
      };
    }
    const win = checkWinner(board);
    return {
      board,
      currentTurn: w,
      status: "win",
      winner: w,
      winLine: win?.line ?? null,
    };
  }

  const win = checkWinner(board);
  if (win !== null) {
    return {
      board,
      currentTurn,
      status: "win",
      winner: win.winner,
      winLine: win.line,
    };
  }

  return {
    board,
    currentTurn,
    status: "playing",
    winner: null,
    winLine: null,
  };
}
