import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { firestoreDataToGameDoc } from "@/lib/online/gameDocMappers";
import { checkWinner, isDraw } from "@/lib/game/logic";
import type { IGameService } from "@/lib/services/interfaces/IGameService";
import type { GameDoc } from "@/types/firebase";
import type { BoardCell } from "@/types/game";

const GAMES = "games";

function emptyBoard(): BoardCell[] {
  return [null, null, null, null, null, null, null, null, null];
}

function roleForUid(g: GameDoc, uid: string): "X" | "O" {
  if (uid === g.playerX.uid) return "X";
  if (g.playerO !== null && uid === g.playerO.uid) return "O";
  throw new Error("Player not in game");
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

  async makeMove(gameId: string, cellIndex: number, player: "X" | "O"): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (uid === undefined || uid === "") throw new Error("Not authenticated");

    const ref = doc(db, GAMES, gameId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = firestoreDataToGameDoc(gameId, snap.data());
      if (g.status !== "active") return;
      if (g.playerO === null) return;
      if (g.currentTurn !== uid) return;
      const expected = roleForUid(g, uid);
      if (expected !== player) return;
      if (cellIndex < 0 || cellIndex > 8) return;

      const board = [...g.board] as BoardCell[];
      if (board[cellIndex] !== null) return;

      const mark: BoardCell = player === "X" ? "X" : "O";
      board[cellIndex] = mark;

      const win = checkWinner(board);
      if (win !== null) {
        const winUid = win.winner === "X" ? g.playerX.uid : g.playerO.uid;
        tx.update(ref, {
          board,
          status: "finished",
          winner: winUid,
          currentTurn: uid,
        });
        return;
      }

      if (isDraw(board)) {
        tx.update(ref, {
          board,
          status: "finished",
          winner: "draw",
          currentTurn: uid,
        });
        return;
      }

      const nextUid = uid === g.playerX.uid ? g.playerO.uid : g.playerX.uid;
      tx.update(ref, {
        board,
        currentTurn: nextUid,
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

  async acceptRematch(gameId: string, uid: string): Promise<string> {
    return runTransaction(db, async (tx) => {
      const ref = doc(db, GAMES, gameId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return "";
      const d = firestoreDataToGameDoc(gameId, snap.data());
      if (d.status !== "finished") return "";
      if (d.playerO === null) return "";
      const xUid = d.playerX.uid;
      const oUid = d.playerO.uid;
      const rematch = { ...d.rematch, [uid]: true };
      const both = Boolean(rematch[xUid] && rematch[oUid]);
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
        currentTurn: d.playerX.uid,
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
