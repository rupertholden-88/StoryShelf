"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getRedirectResult, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink,
  signInWithPopup, signInWithRedirect, signOut as fbSignOut, type User,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  /** Why the last sign-in failed, in words for the person signing in. */
  error: string | null;
  signIn: () => Promise<void>;
  /** Emails a one-tap sign-in link, for people without a Google account. */
  sendEmailLink: (email: string) => Promise<boolean>;
  /** Set when a sign-in link was opened on a different device and we need the address again. */
  needsEmailForLink: boolean;
  finishEmailLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  sendEmailLink: async () => false,
  needsEmailForLink: false,
  finishEmailLink: async () => {},
  signOut: async () => {},
});

const LINK_EMAIL = "nb-link-email";

// Popups can't open (or can't report back) in these cases, so a full-page redirect is used instead.
const USE_REDIRECT = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);
const IGNORE = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

function message(code: string): string {
  if (code === "auth/network-request-failed") return "Couldn't reach Google. Check your connection and try again.";
  if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") return "That sign-in link has expired or was already used. Ask for a new one.";
  if (code === "auth/invalid-email") return "That doesn't look like an email address.";
  if (code === "auth/operation-not-allowed") return "Email sign-in isn't switched on yet. Turn on Email link sign-in in Firebase.";
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
  const [needsEmailForLink, setNeedsEmailForLink] = useState(false);

  const fail = (e: unknown) => {
    const code = (e as { code?: string })?.code ?? "";
    if (!IGNORE.has(code)) setError(message(code));
  };

  const finishEmailLink = async (email: string) => {
    setError(null);
    try {
      await signInWithEmailLink(firebaseAuth(), email.trim(), window.location.href);
      try { localStorage.removeItem(LINK_EMAIL); } catch {}
      setNeedsEmailForLink(false);
      window.history.replaceState(null, "", "/");
    } catch (e) {
      fail(e);
    }
  };

  useEffect(() => {
    getRedirectResult(firebaseAuth()).catch(fail);
    // Arriving from an emailed sign-in link.
    if (isSignInWithEmailLink(firebaseAuth(), window.location.href)) {
      let email: string | null = null;
      try { email = localStorage.getItem(LINK_EMAIL); } catch {}
      if (email) finishEmailLink(email);
      else setNeedsEmailForLink(true);
    }
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
      fail(e);
    }
  };

  const sendEmailLink = async (email: string) => {
    setError(null);
    try {
      await sendSignInLinkToEmail(firebaseAuth(), email.trim(), { url: `${window.location.origin}/`, handleCodeInApp: true });
      try { localStorage.setItem(LINK_EMAIL, email.trim()); } catch {}
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };
  const signOut = async () => {
    await fbSignOut(firebaseAuth());
  };

  return <AuthContext.Provider value={{ user, loading, error, signIn, sendEmailLink, needsEmailForLink, finishEmailLink, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function firstName(u: User | null): string {
  return (u?.displayName || u?.email || "Someone").split(/[\s@]/)[0];
}
