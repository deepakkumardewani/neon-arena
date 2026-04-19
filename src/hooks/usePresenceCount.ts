import { useEffect, useState } from "react";

import { presenceService } from "@/lib/services/presence";

/** Live RTDB presence count only (no connect). Session is owned by `usePresenceSession` at app root. */
export function usePresenceCount(): { readonly onlineCount: number } {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    return presenceService.subscribeToCount(setOnlineCount);
  }, []);

  return { onlineCount };
}
