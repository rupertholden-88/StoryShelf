import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore,
} from "firebase/firestore";
import { firebaseConfig } from "./config";

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;

// Lazy so nothing touches Firebase during server prerendering.
function firebaseApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export const firebaseAuth = (): Auth => getAuth(firebaseApp());

/**
 * Firestore with an on-device cache, so the shelves appear straight away on launch and still work offline.
 * Falls back to the default in-memory cache if the device can't store it (e.g. some private browsing modes).
 */
export function db(): Firestore {
  if (firestore) return firestore;
  try {
    firestore = initializeFirestore(firebaseApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    firestore = getFirestore(firebaseApp());
  }
  // Local testing against the Firestore emulator, e.g. NEXT_PUBLIC_FIRESTORE_EMULATOR=localhost:8080
  const emulator = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR;
  if (emulator) {
    const [host, port] = emulator.split(":");
    connectFirestoreEmulator(firestore, host, Number(port));
  }
  return firestore;
}

let currentHousehold: string | null = null;

/** Set by the sign-in gate once it has found the library this person belongs to. */
export function setHouseholdId(id: string | null) {
  currentHousehold = id;
}

/** The signed-in person's library. Only called from pages inside the gate, after it's been found. */
export function householdId(): string {
  if (!currentHousehold) throw new Error("No library selected yet");
  return currentHousehold;
}

export const googleProvider = () => new GoogleAuthProvider();
