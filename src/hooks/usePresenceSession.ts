import { useEffect } from "react";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { presenceService } from "@/lib/services";

/**
 * One presence session per browser tab for the whole app (not tied to Home / OnlineCounter mount).
 * Survives route changes so “players online” stays consistent while navigating.
 */
export function usePresenceSession(): void {
  const uid = usePlayerStore((s) => s.uid);
  const nickname = usePlayerStore((s) => s.nickname);

  useEffect(() => {
    if (uid === "") return;
    const label = nickname.trim() === "" ? "Player" : nickname.trim();
    const state = { cancelled: false, sessionKey: null as string | null };

    void presenceService
      .connect(uid, label)
      .then((key) => {
        if (state.cancelled) {
          void presenceService.disconnectSession(key);
        } else {
          state.sessionKey = key;
        }
      })
      .catch(() => {
        /* logged in FirebasePresenceService */
      });

    return () => {
      state.cancelled = true;
      if (state.sessionKey !== null) {
        void presenceService.disconnectSession(state.sessionKey);
        state.sessionKey = null;
      }
    };
  }, [uid, nickname]);
}
