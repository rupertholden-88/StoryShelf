"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";
import { firebaseAuth, googleProvider } from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth(), (u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );

  const signIn = async () => {
    await signInWithPopup(firebaseAuth(), googleProvider());
  };
  const signOut = async () => {
    await fbSignOut(firebaseAuth());
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function firstName(u: User | null): string {
  return (u?.displayName || u?.email || "Someone").split(/[\s@]/)[0];
}
