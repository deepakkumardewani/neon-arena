import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import type { QueueWaiterSnapshot } from "@/lib/services/interfaces/IQueueService";
import { queueService } from "@/lib/services";

function sortWaiters(waiters: readonly QueueWaiterSnapshot[]): QueueWaiterSnapshot[] {
  return [...waiters].sort((a, b) => {
    if (a.joinedAtMs !== b.joinedAtMs) return a.joinedAtMs - b.joinedAtMs;
    return a.uid.localeCompare(b.uid);
  });
}

export function useMatchmaking(): { readonly queueDepth: number } {
  const navigate = useNavigate();
  const uid = usePlayerStore((s) => s.uid);
  const [queueDepth, setQueueDepth] = useState(0);
  const pairingBusy = useRef(false);

  useEffect(() => {
    return queueService.subscribeToQueue((q) => {
      setQueueDepth(q.length);
    });
  }, []);

  useEffect(() => {
    if (uid === "") return;
    return queueService.subscribeMyQueue(uid, (st) => {
      if (st !== null && st.status === "matched" && st.gameId !== null) {
        void navigate(`/game/${st.gameId}?mode=online`);
      }
    });
  }, [navigate, uid]);

  useEffect(() => {
    if (uid === "") return;
    return queueService.subscribeToQueue((waiters) => {
      const sorted = sortWaiters(waiters);
      if (sorted.length < 2) return;
      const first = sorted[0];
      const second = sorted[1];
      if (second.uid !== uid) return;
      if (pairingBusy.current) return;
      pairingBusy.current = true;
      void queueService
        .attemptPair(
          { uid: first.uid, nickname: first.nickname },
          { uid: second.uid, nickname: second.nickname },
        )
        .finally(() => {
          pairingBusy.current = false;
        });
    });
  }, [uid]);

  return { queueDepth };
}
