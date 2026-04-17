import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-not-configured",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-not-configured.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-not-configured",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-not-configured.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000000000000",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-not-configured.firebaseio.com",
};

function getOrInitApp(): FirebaseApp {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(firebaseConfig);
}

const firebaseApp = getOrInitApp();

export const app: FirebaseApp = firebaseApp;
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const rtdb: Database = getDatabase(firebaseApp);
