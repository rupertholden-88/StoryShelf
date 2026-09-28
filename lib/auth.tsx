"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut as fbSignOut, type User,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  /** Why the last sign-in failed, in words for the person signing in. */
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
});

// Popups can't open (or can't report back) in these cases, so a full-page redirect is used instead.
const USE_REDIRECT = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);
const IGNORE = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

function message(code: string): string {
  if (code === "auth/network-request-failed") return "Couldn't reach Google. Check your connection and try again.";
  if (code === "auth/unauthorized-domain") return "This web address isn't allowed to sign in yet. Add it under Authorised domains in Firebase.";
  return "Signing in didn't work. Please try again.";
}

/** Home-screen apps on iPhone can't hand a popup's result back, so they go straight to a redirect. */
function standaloneIos(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(firebaseAuth()).catch((e) => {
      const code = (e as { code?: string })?.code ?? "";
      if (!IGNORE.has(code)) setError(message(code));
    });
    return onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    setError(null);
    const auth = firebaseAuth();
    if (standaloneIos()) return signInWithRedirect(auth, googleProvider());
    try {
      await signInWithPopup(auth, googleProvider());
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (USE_REDIRECT.has(code)) return signInWithRedirect(auth, googleProvider());
      if (!IGNORE.has(code)) setError(message(code));
    }
  };
  const signOut = async () => {
    await fbSignOut(firebaseAuth());
  };

  return <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function firstName(u: User | null): string {
  return (u?.displayName || u?.email || "Someone").split(/[\s@]/)[0];
}
