import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore,
} from "firebase/firestore";
import { firebaseConfig, HOUSEHOLD_ID } from "./config";

export { HOUSEHOLD_ID };

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
  return firestore;
}

export const googleProvider = () => new GoogleAuthProvider();
