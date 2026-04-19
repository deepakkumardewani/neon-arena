import { onValue, ref, type Database } from "firebase/database";

/** Subscribes to Firebase RTDB client connection state (`.info/connected`). */
export function subscribeRtdbConnected(
  database: Database,
  onChange: (connected: boolean) => void,
): () => void {
  const connectedRef = ref(database, ".info/connected");
  return onValue(connectedRef, (snap) => {
    onChange(snap.val() === true);
  });
}
