import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { getMatchmakingQueueEntryId } from "@/lib/matchmaking/queueEntryId";
import type { QueueWaiterSnapshot } from "@/lib/services/interfaces/IQueueService";
import { queueService } from "@/lib/services";

function sortWaiters(waiters: readonly QueueWaiterSnapshot[]): QueueWaiterSnapshot[] {
  return [...waiters].sort((a, b) => {
    if (a.joinedAtMs !== b.joinedAtMs) return a.joinedAtMs - b.joinedAtMs;
    return a.queueEntryId.localeCompare(b.queueEntryId);
  });
}

export function useMatchmaking(): { readonly queueDepth: number } {
  const navigate = useNavigate();
  const uid = usePlayerStore((s) => s.uid);
  const queueEntryId = useMemo(() => getMatchmakingQueueEntryId(uid), [uid]);
  const [queueDepth, setQueueDepth] = useState(0);
  const pairingBusy = useRef(false);

  useEffect(() => {
    return queueService.subscribeToQueue((q) => {
      setQueueDepth(q.length);
    });
  }, []);

  useEffect(() => {
    if (uid === "" || queueEntryId === "") return;
    return queueService.subscribeMyQueue(queueEntryId, (st) => {
      if (st !== null && st.status === "matched" && st.gameId !== null) {
        void navigate(`/game/${st.gameId}?mode=online`);
      }
    });
  }, [navigate, uid, queueEntryId]);

  useEffect(() => {
    if (uid === "" || queueEntryId === "") return;
    return queueService.subscribeToQueue((waiters) => {
      const sorted = sortWaiters(waiters);
      if (sorted.length < 2) return;
      const first = sorted[0];
      const second = sorted[1];
      if (second.queueEntryId !== queueEntryId) return;
      if (pairingBusy.current) return;
      pairingBusy.current = true;
      void queueService
        .attemptPair(
          {
            queueEntryId: first.queueEntryId,
            authUid: first.authUid,
            nickname: first.nickname,
          },
          {
            queueEntryId: second.queueEntryId,
            authUid: second.authUid,
            nickname: second.nickname,
          },
        )
        .finally(() => {
          pairingBusy.current = false;
        });
    });
  }, [uid, queueEntryId]);

  return { queueDepth };
}
