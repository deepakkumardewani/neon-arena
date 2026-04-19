const STORAGE_KEY = "na-mm-queue-suffix";
/** Must match `firestore.rules` (`ownQueueDoc`). */
export const QUEUE_ENTRY_SEP = "_na_mm_";

/**
 * Stable per browser-tab id for the matchmaking queue document. Multiple windows/tabs share one
 * Firebase anonymous user but must not share one queue row — otherwise the queue depth stays 1 and
 * pairing never runs.
 */
export function getMatchmakingQueueEntryId(firebaseUid: string): string {
  if (firebaseUid === "") return "";
  if (typeof sessionStorage === "undefined") {
    return firebaseUid;
  }
  let suffix = sessionStorage.getItem(STORAGE_KEY);
  if (suffix === null || !/^[a-f0-9]{32}$/u.test(suffix)) {
    suffix = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    sessionStorage.setItem(STORAGE_KEY, suffix);
  }
  return `${firebaseUid}${QUEUE_ENTRY_SEP}${suffix}`;
}
