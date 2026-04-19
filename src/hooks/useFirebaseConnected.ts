import { useEffect, useState } from "react";

import { rtdb } from "@/lib/firebase/client";
import { subscribeRtdbConnected } from "@/lib/firebase/subscribeRtdbConnected";

/**
 * Tracks RTDB `.info/connected` when `enabled`.
 * Returns `null` while disabled or before the first snapshot.
 */
export function useFirebaseConnected(enabled: boolean): boolean | null {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled) {
      setConnected(null);
      return;
    }
    setConnected(null);
    return subscribeRtdbConnected(rtdb, setConnected);
  }, [enabled]);

  return enabled ? connected : null;
}
