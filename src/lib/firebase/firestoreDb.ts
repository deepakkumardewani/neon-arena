import { initializeFirestore, type Firestore } from "firebase/firestore";

import { app } from "@/lib/firebase/client";

/**
 * Firestore is split from `client.ts` so Auth + RTDB paths do not eagerly load Firestore.
 *
 * Safari/WebKit often fails the default WebChannel streaming transport to Firestore
 * (`Fetch ... channel ... due to access control checks`), which prevents `onSnapshot`
 * from ever receiving data — friend lobby stays on "Connecting to room…". Long polling
 * avoids that transport.
 */
export const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
