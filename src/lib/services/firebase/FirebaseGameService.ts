import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth } from "@/lib/firebase/client";
import { db } from "@/lib/firebase/firestoreDb";
import { firestoreDataToGameDoc } from "@/lib/online/gameDocMappers";
import { checkWinner, isDraw } from "@/lib/game/logic";
import type { IGameService } from "@/lib/services/interfaces/IGameService";
import type { GameDoc, GameDocPlayer } from "@/types/firebase";
import type { BoardCell } from "@/types/game";

const GAMES = "games";

function emptyBoard(): BoardCell[] {
  return [null, null, null, null, null, null, null, null, null];
}

function identityOf(p: GameDocPlayer): string {
  return p.queueEntryId ?? p.uid;
}

export class FirebaseGameService implements IGameService {
  async createGame(playerX: { uid: string; nickname: string }): Promise<string> {
    const ref = doc(collection(db, GAMES));
    const gameId = ref.id;
    const now = Date.now();
    await setDoc(ref, {
      gameId,
      playerX,
      playerO: null,
      board: emptyBoard(),
      currentTurn: playerX.uid,
      status: "waiting",
      winner: null,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      disconnectedAt: null,
      disconnectedBy: null,
      rematch: {},
    });
    return gameId;
  }

  async joinGame(gameId: string, playerO: { uid: string; nickname: string }): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Game not found");
      const g = firestoreDataToGameDoc(gameId, snap.data());
      if (g.expiresAt > 0 && Date.now() > g.expiresAt) {
        throw new Error("Game expired");
      }
      if (g.status !== "waiting") throw new Error("Game not joinable");
      if (g.playerO !== null) throw new Error("Game full");
      if (g.playerX.uid === playerO.uid) throw new Error("Cannot join own game");
      tx.update(ref, {
        playerO,
        status: "active",
      });
    });
  }

  async makeMove(
    gameId: string,
    cellIndex: number,
    player: "X" | "O",
    clientQueueEntryId?: string,
  ): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (uid === undefined || uid === "") throw new Error("Not authenticated");

    const ref = doc(db, GAMES, gameId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = firestoreDataToGameDoc(gameId, snap.data());
      if (g.status !== "active") return;
      if (g.playerO === null) return;

      const mover: GameDocPlayer = player === "X" ? g.playerX : g.playerO;
      if (mover.uid !== uid) return;
      if (mover.queueEntryId !== undefined) {
        if (clientQueueEntryId !== mover.queueEntryId) return;
      }

      const moverIdentity = identityOf(mover);
      if (g.currentTurn !== moverIdentity) return;
      if (cellIndex < 0 || cellIndex > 8) return;

      const board = [...g.board] as BoardCell[];
      if (board[cellIndex] !== null) return;

      const mark: BoardCell = player === "X" ? "X" : "O";
      board[cellIndex] = mark;

      const win = checkWinner(board);
      if (win !== null) {
        const winPl = win.winner === "X" ? g.playerX : g.playerO!;
        tx.update(ref, {
          board,
          status: "finished",
          winner: identityOf(winPl),
          currentTurn: moverIdentity,
        });
        return;
      }

      if (isDraw(board)) {
        tx.update(ref, {
          board,
          status: "finished",
          winner: "draw",
          currentTurn: moverIdentity,
        });
        return;
      }

      const other: GameDocPlayer = player === "X" ? g.playerO! : g.playerX;
      tx.update(ref, {
        board,
        currentTurn: identityOf(other),
      });
    });
  }

  subscribeToGame(gameId: string, cb: (game: GameDoc) => void): () => void {
    const ref = doc(db, GAMES, gameId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      cb(firestoreDataToGameDoc(gameId, snap.data()));
    });
  }

  async setDisconnected(gameId: string, uid: string): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await updateDoc(ref, {
      disconnectedAt: Date.now(),
      disconnectedBy: uid,
    });
  }

  async declineRematch(gameId: string, uid: string): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await updateDoc(ref, {
      rematchDeclined: true,
      rematchDeclinedBy: uid,
    });
  }

  async acceptRematch(gameId: string, uid: string, clientQueueEntryId?: string): Promise<string> {
    return runTransaction(db, async (tx) => {
      const ref = doc(db, GAMES, gameId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return "";
      const d = firestoreDataToGameDoc(gameId, snap.data());
      if (d.status !== "finished") return "";
      if (d.playerO === null) return "";

      let acceptKey: string | null = null;
      if (d.playerX.uid === uid) {
        if (d.playerX.queueEntryId === undefined) acceptKey = identityOf(d.playerX);
        else if (clientQueueEntryId === d.playerX.queueEntryId) acceptKey = identityOf(d.playerX);
      }
      if (acceptKey === null && d.playerO.uid === uid) {
        if (d.playerO.queueEntryId === undefined) acceptKey = identityOf(d.playerO);
        else if (clientQueueEntryId === d.playerO.queueEntryId) acceptKey = identityOf(d.playerO);
      }
      if (acceptKey === null) return "";

      const xKey = identityOf(d.playerX);
      const oKey = identityOf(d.playerO);
      const rematch = { ...d.rematch, [acceptKey]: true };
      const both = Boolean(rematch[xKey] && rematch[oKey]);
      if (!both) {
        tx.update(ref, { rematch });
        return "";
      }
      const newRef = doc(collection(db, GAMES));
      const newId = newRef.id;
      const now = Date.now();
      tx.set(newRef, {
        gameId: newId,
        playerX: d.playerX,
        playerO: d.playerO,
        board: emptyBoard(),
        currentTurn: identityOf(d.playerX),
        status: "active",
        winner: null,
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000,
        disconnectedAt: null,
        disconnectedBy: null,
        rematch: {},
      });
      tx.update(ref, { rematch, nextGameId: newId });
      return newId;
    });
  }

  async getGame(gameId: string): Promise<GameDoc | null> {
    const snap = await getDoc(doc(db, GAMES, gameId));
    if (!snap.exists()) return null;
    return firestoreDataToGameDoc(gameId, snap.data());
  }
}
