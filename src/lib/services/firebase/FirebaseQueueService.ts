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

import { db } from "@/lib/firebase/firestoreDb";
import type {
  IQueueService,
  MyQueueDocState,
  QueueWaiterSnapshot,
} from "@/lib/services/interfaces/IQueueService";
import { QUEUE_ENTRY_SEP } from "@/lib/matchmaking/queueEntryId";
import type { BoardCell } from "@/types/game";

const QUEUE = "queue";
const GAMES = "games";

function authUidFromQueueDoc(docId: string, rawAuthUid: unknown): string {
  if (typeof rawAuthUid === "string" && rawAuthUid.length > 0) return rawAuthUid;
  const i = docId.indexOf(QUEUE_ENTRY_SEP);
  if (i === -1) return docId;
  return docId.slice(0, i);
}

function emptyBoard(): BoardCell[] {
  return [null, null, null, null, null, null, null, null, null];
}

function readJoinedAtMs(value: Timestamp | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

export class FirebaseQueueService implements IQueueService {
  async enqueue(queueEntryId: string, authUid: string, nickname: string): Promise<void> {
    await setDoc(
      doc(db, QUEUE, queueEntryId),
      {
        authUid,
        nickname,
        joinedAt: serverTimestamp(),
        status: "waiting",
      },
      { merge: true },
    );
  }

  async dequeue(queueEntryId: string): Promise<void> {
    await deleteDoc(doc(db, QUEUE, queueEntryId));
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
        out.push({
          queueEntryId: d.id,
          authUid: authUidFromQueueDoc(d.id, raw.authUid),
          nickname,
          joinedAtMs,
        });
      }
      cb(out);
    });
  }

  subscribeMyQueue(queueEntryId: string, cb: (state: MyQueueDocState | null) => void): () => void {
    return onSnapshot(doc(db, QUEUE, queueEntryId), (snap) => {
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
    first: { queueEntryId: string; authUid: string; nickname: string },
    second: { queueEntryId: string; authUid: string; nickname: string },
  ): Promise<string | null> {
    const gameRef = doc(collection(db, GAMES));
    const gid = gameRef.id;
    const q0 = doc(db, QUEUE, first.queueEntryId);
    const q1 = doc(db, QUEUE, second.queueEntryId);
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
        playerX: {
          uid: first.authUid,
          nickname: first.nickname,
          queueEntryId: first.queueEntryId,
        },
        playerO: {
          uid: second.authUid,
          nickname: second.nickname,
          queueEntryId: second.queueEntryId,
        },
        board: emptyBoard(),
        currentTurn: first.queueEntryId,
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
