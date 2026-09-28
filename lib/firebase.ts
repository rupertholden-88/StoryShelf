import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// The Firebase web config is public by design (it ships to every browser).
// Data is protected by firestore.rules, not by hiding these values.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAnXbu8iY7fpJvo6yra5Ve7qXozICVQ4Cs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "storyshelf-faa45.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "storyshelf-faa45",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "storyshelf-faa45.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "991579376605",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:991579376605:web:32ed4a59c0ef713daf4434",
};

export const HOUSEHOLD_ID = "holden";

let app: FirebaseApp | undefined;

// Lazy so nothing touches Firebase during server prerendering.
function firebaseApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(config);
  return app;
}

export const firebaseAuth = (): Auth => getAuth(firebaseApp());
export const db = (): Firestore => getFirestore(firebaseApp());
export const googleProvider = () => new GoogleAuthProvider();
