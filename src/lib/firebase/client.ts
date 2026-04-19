import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

const DEMO_DB_URL = "https://demo-not-configured.firebaseio.com";

/** Trailing slashes and stray whitespace break RTDB connections; regional DBs need an exact URL. */
function normalizeDatabaseUrl(raw: string | undefined): string {
  if (raw === undefined) return DEMO_DB_URL;
  const trimmed = raw.trim();
  if (trimmed === "") return DEMO_DB_URL;
  return trimmed.replace(/\/+$/, "");
}

const databaseURL = normalizeDatabaseUrl(import.meta.env.VITE_FIREBASE_DATABASE_URL);

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== undefined &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== "" &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== "demo-not-configured"
) {
  const raw = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  if (raw === undefined || String(raw).trim() === "") {
    console.warn(
      "[NeonArena] VITE_FIREBASE_DATABASE_URL is missing or empty — put the full URL on the same line as the key in .env, then restart `vp dev`.",
    );
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-not-configured",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-not-configured.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-not-configured",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-not-configured.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000000000000",
  databaseURL,
};

function getOrInitApp(): FirebaseApp {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(firebaseConfig);
}

const firebaseApp = getOrInitApp();

export const app: FirebaseApp = firebaseApp;
export const auth: Auth = getAuth(firebaseApp);
/** Pass URL explicitly so regional instances (non–us-central1) resolve correctly. */
export const rtdb: Database = getDatabase(firebaseApp, databaseURL);
