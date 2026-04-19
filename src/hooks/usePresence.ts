import { useEffect, useState } from "react";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { presenceService } from "@/lib/services";

export function usePresence(): { readonly onlineCount: number } {
  const uid = usePlayerStore((s) => s.uid);
  const nickname = usePlayerStore((s) => s.nickname);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    return presenceService.subscribeToCount(setOnlineCount);
  }, []);

  useEffect(() => {
    if (uid === "") return;
    const label = nickname.trim() === "" ? "Player" : nickname.trim();
    void presenceService.connect(uid, label).catch(() => {
      /* Errors logged in FirebasePresenceService (dev) */
    });
    return () => {
      void presenceService.disconnect(uid);
    };
  }, [uid, nickname]);

  return { onlineCount };
}
