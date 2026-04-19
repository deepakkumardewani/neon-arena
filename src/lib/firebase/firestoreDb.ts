import { getFirestore, type Firestore } from "firebase/firestore";

import { app } from "@/lib/firebase/client";

/** Firestore is split from `client.ts` so Auth + RTDB paths do not eagerly load Firestore. */
export const db: Firestore = getFirestore(app);
