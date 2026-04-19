import { onDisconnect, onValue, push, ref, remove, set, serverTimestamp } from "firebase/database";

import { rtdb } from "@/lib/firebase/client";
import type { IPresenceService } from "@/lib/services/interfaces/IPresenceService";

interface SessionRecord {
  readonly uid: string;
}

function countPresenceSessions(snap: import("firebase/database").DataSnapshot): number {
  if (!snap.exists()) return 0;
  let n = 0;
  snap.forEach(() => {
    n += 1;
    return false;
  });
  return n;
}

export class FirebasePresenceService implements IPresenceService {
  private readonly sessions = new Map<string, SessionRecord>();

  async connect(uid: string, nickname: string): Promise<void> {
    const presenceList = ref(rtdb, "presence");
    const sessionRef = push(presenceList);
    const key = sessionRef.key;
    if (key === null) {
      throw new Error("presence session key missing");
    }
    await set(sessionRef, {
      uid,
      nickname,
      connectedAt: serverTimestamp(),
    });
    await onDisconnect(sessionRef).remove();
    this.sessions.set(key, { uid });
  }

  async disconnect(uid: string): Promise<void> {
    const toRemove: string[] = [];
    for (const [key, rec] of this.sessions) {
      if (rec.uid === uid) toRemove.push(key);
    }
    await Promise.all(
      toRemove.map(async (key) => {
        const rec = this.sessions.get(key);
        this.sessions.delete(key);
        if (rec === undefined) return;
        await remove(ref(rtdb, `presence/${key}`));
      }),
    );
  }

  subscribeToCount(cb: (count: number) => void): () => void {
    const connectedRef = ref(rtdb, ".info/connected");
    const presenceRoot = ref(rtdb, "presence");
    let lastEmitted = 0;
    let online = false;

    const emitCount = (snap: import("firebase/database").DataSnapshot): void => {
      const n = countPresenceSessions(snap);
      if (!online && lastEmitted > 0) {
        cb(lastEmitted);
        return;
      }
      lastEmitted = n;
      cb(n);
    };

    const unsubConnected = onValue(connectedRef, (s) => {
      const nextOnline = s.val() === true;
      online = nextOnline;
      if (!online && lastEmitted > 0) {
        cb(lastEmitted);
      }
    });

    const unsubPresence = onValue(presenceRoot, emitCount);

    return () => {
      unsubConnected();
      unsubPresence();
    };
  }
}
