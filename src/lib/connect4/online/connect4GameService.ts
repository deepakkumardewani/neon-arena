import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestoreDb";
import { auth } from "@/lib/firebase/client";
import { firestoreDataToGameDoc } from "@/lib/online/gameDocMappers";
import type { GameDoc, GameDocPlayer } from "@/types/firebase";

const GAMES = "games";

function playerIdentity(p: GameDocPlayer): string {
  return p.queueEntryId ?? p.uid;
}

function emptyC4Board(): readonly (readonly number[])[] {
  return Array.from({ length: 7 }, () => Array(6).fill(0));
}

export interface Connect4GameService {
  createConnect4Game(
    playerX: GameDocPlayer,
    playerO?: GameDocPlayer,
  ): Promise<string>;
  joinConnect4Game(gameId: string, playerO: GameDocPlayer): Promise<void>;
  commitMove(
    gameId: string,
    payload: {
      c4board: readonly (readonly number[])[];
      c4history: readonly { col: number; row: number; player: number }[];
      currentTurn: string;
      c4winCells: readonly [number, number][] | null;
    },
  ): Promise<void>;
  subscribeConnect4Game(gameId: string, cb: (game: GameDoc) => void): () => void;
  resignGame(gameId: string, playerIdentity: string): Promise<void>;
  finishGame(gameId: string, winner: string | null): Promise<void>;
  setDisconnected(gameId: string, uid: string): Promise<void>;
  acceptRematch(gameId: string, uid: string, clientQueueEntryId?: string): Promise<string>;
  declineRematch(gameId: string, uid: string): Promise<void>;
  getGame(gameId: string): Promise<GameDoc | null>;
}

export const connect4GameService: Connect4GameService = {
  async createConnect4Game(
    playerX: GameDocPlayer,
    playerO?: GameDocPlayer,
  ): Promise<string> {
    const ref = doc(collection(db, GAMES));
    const gameId = ref.id;
    const now = Date.now();
    const gameData: Record<string, unknown> = {
      gameId,
      gameType: "connect4",
      playerX,
      playerO: playerO ?? null,
      board: [],
      c4board: emptyC4Board(),
      c4history: [],
      c4winCells: null,
      currentTurn: playerIdentity(playerX),
      status: playerO ? "active" : "waiting",
      winner: null,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      disconnectedAt: null,
      disconnectedBy: null,
      rematch: {},
    };
    await setDoc(ref, gameData);
    return gameId;
  },

  async joinConnect4Game(gameId: string, playerO: GameDocPlayer): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Game not found");
      const g = firestoreDataToGameDoc(gameId, snap.data());
      if (g.expiresAt > 0 && Date.now() > g.expiresAt) throw new Error("Game expired");
      if (g.status !== "waiting") throw new Error("Game not joinable");
      if (g.playerO !== null) throw new Error("Game full");
      if (g.playerX.uid === playerO.uid) throw new Error("Cannot join own game");
      tx.update(ref, {
        playerO,
        status: "active",
      });
    });
  },

  async commitMove(
    gameId: string,
    payload: {
      c4board: readonly (readonly number[])[];
      c4history: readonly { col: number; row: number; player: number }[];
      currentTurn: string;
      c4winCells: readonly [number, number][] | null;
    },
  ): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const ref = doc(db, GAMES, gameId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = firestoreDataToGameDoc(gameId, snap.data());
      if (g.status !== "active") return;

      const isPlayerX = g.playerX.uid === uid;
      const isPlayerO = g.playerO !== null && g.playerO.uid === uid;
      if (!isPlayerX && !isPlayerO) return;

      const mover = isPlayerX ? g.playerX : g.playerO!;
      if (g.currentTurn !== playerIdentity(mover)) return;

      // Check for win and update status
      const hasWin = payload.c4winCells !== null && payload.c4winCells.length > 0;
      tx.update(ref, {
        c4board: payload.c4board,
        c4history: payload.c4history,
        currentTurn: payload.currentTurn,
        c4winCells: payload.c4winCells,
        ...(hasWin ? { status: "finished", winner: playerIdentity(mover) } : {}),
      });
    });
  },

  subscribeConnect4Game(gameId: string, cb: (game: GameDoc) => void): () => void {
    const ref = doc(db, GAMES, gameId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      cb(firestoreDataToGameDoc(gameId, snap.data()));
    });
  },

  async resignGame(gameId: string, playerIdentity: string): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await updateDoc(ref, {
      status: "finished",
      winner: playerIdentity,
    });
  },

  async finishGame(gameId: string, winner: string | null): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await updateDoc(ref, {
      status: "finished",
      winner,
    });
  },

  async setDisconnected(gameId: string, uid: string): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await updateDoc(ref, {
      disconnectedAt: Date.now(),
      disconnectedBy: uid,
    });
  },

  async acceptRematch(
    gameId: string,
    uid: string,
    clientQueueEntryId?: string,
  ): Promise<string> {
    return runTransaction(db, async (tx) => {
      const ref = doc(db, GAMES, gameId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return "";
      const d = firestoreDataToGameDoc(gameId, snap.data());
      if (d.status !== "finished") return "";
      if (d.playerO === null) return "";

      let acceptKey: string | null = null;
      if (d.playerX.uid === uid) {
        if (d.playerX.queueEntryId === undefined) acceptKey = playerIdentity(d.playerX);
        else if (clientQueueEntryId === d.playerX.queueEntryId)
          acceptKey = playerIdentity(d.playerX);
      }
      if (acceptKey === null && d.playerO.uid === uid) {
        if (d.playerO.queueEntryId === undefined) acceptKey = playerIdentity(d.playerO);
        else if (clientQueueEntryId === d.playerO.queueEntryId)
          acceptKey = playerIdentity(d.playerO);
      }
      if (acceptKey === null) return "";

      const xKey = playerIdentity(d.playerX);
      const oKey = playerIdentity(d.playerO);
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
        gameType: "connect4",
        playerX: d.playerX,
        playerO: d.playerO,
        board: [],
        c4board: emptyC4Board(),
        c4history: [],
        c4winCells: null,
        currentTurn: playerIdentity(d.playerX),
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
  },

  async declineRematch(gameId: string, uid: string): Promise<void> {
    const ref = doc(db, GAMES, gameId);
    await updateDoc(ref, {
      rematchDeclined: true,
      rematchDeclinedBy: uid,
    });
  },

  async getGame(gameId: string): Promise<GameDoc | null> {
    const snap = await getDoc(doc(db, GAMES, gameId));
    if (!snap.exists()) return null;
    return firestoreDataToGameDoc(gameId, snap.data());
  },
};
