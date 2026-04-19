import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type {
  IQueueService,
  MyQueueDocState,
  QueueWaiterSnapshot,
} from "@/lib/services/interfaces/IQueueService";
import type { BoardCell } from "@/types/game";

const QUEUE = "queue";
const GAMES = "games";

function emptyBoard(): BoardCell[] {
  return [null, null, null, null, null, null, null, null, null];
}

function readJoinedAtMs(value: Timestamp | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

export class FirebaseQueueService implements IQueueService {
  async enqueue(uid: string, nickname: string): Promise<void> {
    await setDoc(
      doc(db, QUEUE, uid),
      {
        nickname,
        joinedAt: serverTimestamp(),
        status: "waiting",
      },
      { merge: true },
    );
  }

  async dequeue(uid: string): Promise<void> {
    await deleteDoc(doc(db, QUEUE, uid));
  }

  subscribeToQueue(cb: (queue: readonly QueueWaiterSnapshot[]) => void): () => void {
    return onSnapshot(collection(db, QUEUE), (snap) => {
      const out: QueueWaiterSnapshot[] = [];
      for (const d of snap.docs) {
        const raw = d.data();
        const status = raw.status;
        if (status !== "waiting") continue;
        const nickname = typeof raw.nickname === "string" ? raw.nickname : "Player";
        const joinedAtMs = readJoinedAtMs(raw.joinedAt as Timestamp | undefined);
        out.push({ uid: d.id, nickname, joinedAtMs });
      }
      cb(out);
    });
  }

  subscribeMyQueue(uid: string, cb: (state: MyQueueDocState | null) => void): () => void {
    return onSnapshot(doc(db, QUEUE, uid), (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      const r = snap.data();
      const status = typeof r.status === "string" ? r.status : "";
      const gameId = typeof r.gameId === "string" ? r.gameId : null;
      cb({ status, gameId });
    });
  }

  async attemptPair(
    first: { uid: string; nickname: string },
    second: { uid: string; nickname: string },
  ): Promise<string | null> {
    const gameRef = doc(collection(db, GAMES));
    const gid = gameRef.id;
    const q0 = doc(db, QUEUE, first.uid);
    const q1 = doc(db, QUEUE, second.uid);
    const now = Date.now();
    const out = await runTransaction(db, async (tx) => {
      const s0 = await tx.get(q0);
      const s1 = await tx.get(q1);
      if (!s0.exists() || !s1.exists()) return null;
      const d0 = s0.data();
      const d1 = s1.data();
      if (d0.status !== "waiting" || d1.status !== "waiting") return null;
      tx.set(gameRef, {
        gameId: gid,
        playerX: { uid: first.uid, nickname: first.nickname },
        playerO: { uid: second.uid, nickname: second.nickname },
        board: emptyBoard(),
        currentTurn: first.uid,
        status: "active",
        winner: null,
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000,
        disconnectedAt: null,
        disconnectedBy: null,
        rematch: {},
      });
      tx.update(q0, { status: "matched", gameId: gid });
      tx.update(q1, { status: "matched", gameId: gid });
      return gid;
    });
    return out;
  }
}
