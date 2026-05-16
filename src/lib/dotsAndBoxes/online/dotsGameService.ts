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
import { stateToDoc } from "./dotsGameMappers";
import type { GameDoc, GameDocPlayer } from "@/types/firebase";
import type { DotsGameState } from "../types";

const GAMES = "games";

function playerIdentity(p: GameDocPlayer): string {
  return p.queueEntryId ?? p.uid;
}

export interface DotsGameService {
  createDotsGame(playerX: GameDocPlayer, playerO?: GameDocPlayer): Promise<string>;
  joinDotsGame(gameId: string, playerO: GameDocPlayer): Promise<void>;
  commitMove(gameId: string, state: DotsGameState): Promise<void>;
  subscribeDotsGame(gameId: string, cb: (game: GameDoc) => void): () => void;
  resignGame(gameId: string, playerIdentity: string): Promise<void>;
  getGame(gameId: string): Promise<GameDoc | null>;
}

// Initial 5x5 state
function createInitialDotsState() {
  return {
    horizontalEdges: Array(6)
      .fill(null)
      .map(() => Array(5).fill(false)),
    verticalEdges: Array(5)
      .fill(null)
      .map(() => Array(6).fill(false)),
    boxOwner: Array(5)
      .fill(null)
      .map(() => Array(5).fill(null)),
    currentPlayer: 1,
    scores: { 1: 0, 2: 0 },
    history: [],
    status: "playing" as const,
    winner: null,
  };
}

export const dotsGameService: DotsGameService = {
  async createDotsGame(playerX: GameDocPlayer, playerO?: GameDocPlayer): Promise<string> {
    const ref = doc(collection(db, GAMES));
    const gameId = ref.id;
    const now = Date.now();
    const initialState = createInitialDotsState();

    const gameData: Record<string, unknown> = {
      gameId,
      gameType: "dots-and-boxes",
      playerX,
      playerO: playerO ?? null,
      ...initialState,
      currentTurn: playerIdentity(playerX),
      status: playerO ? "active" : "waiting",
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      disconnectedAt: null,
      disconnectedBy: null,
      lastMoveAt: now,
    };

    await setDoc(ref, gameData);
    return gameId;
  },

  async joinDotsGame(gameId: string, playerO: GameDocPlayer): Promise<void> {
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

  async commitMove(gameId: string, state: DotsGameState): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const ref = doc(db, GAMES, gameId);
    const patch = stateToDoc(state);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = firestoreDataToGameDoc(gameId, snap.data());
      if (g.status !== "active") return;

      tx.update(ref, {
        horizontalEdges: patch.horizontalEdges,
        verticalEdges: patch.verticalEdges,
        boxOwner: patch.boxOwner,
        currentPlayer: patch.currentPlayer,
        scores: patch.scores,
        history: patch.history,
        status: patch.status,
        winner: patch.winner,
        lastMoveAt: patch.lastMoveAt,
      });
    });
  },

  subscribeDotsGame(gameId: string, cb: (game: GameDoc) => void): () => void {
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
      winner: playerIdentity, // The resigning player's identity — the OPPONENT wins
    });
  },

  async getGame(gameId: string): Promise<GameDoc | null> {
    const snap = await getDoc(doc(db, GAMES, gameId));
    if (!snap.exists()) return null;
    return firestoreDataToGameDoc(gameId, snap.data());
  },
};
