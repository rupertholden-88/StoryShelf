// Shared by the browser app and the server routes, so no Firebase imports here.

// The Firebase web config is public by design (it ships to every browser).
// Data is protected by firestore.rules, not by hiding these values.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAnXbu8iY7fpJvo6yra5Ve7qXozICVQ4Cs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "storyshelf-faa45.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "storyshelf-faa45",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "storyshelf-faa45.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "991579376605",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:991579376605:web:32ed4a59c0ef713daf4434",
};

/** Document id under /households that holds the library. */
export const HOUSEHOLD_ID = process.env.NEXT_PUBLIC_HOUSEHOLD_ID || "holden";
