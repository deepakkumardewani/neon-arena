import { usePresenceCount } from "@/hooks/usePresenceCount";

/**
 * @deprecated Prefer `usePresenceCount` + app-root `usePresenceSession`.
 * Kept so call sites get count-only behavior without a second RTDB session.
 */
export function usePresence(): { readonly onlineCount: number } {
  return usePresenceCount();
}
