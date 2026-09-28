"use client";

import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/auth";
import { useHousehold } from "@/lib/household";
import type { Household } from "@/lib/types";

export function Gate({ children }: { children: (ctx: { user: User; household: Household }) => ReactNode }) {
  const { user, loading, signIn, signOut } = useAuth();
  const { household, status } = useHousehold(!!user);

  if (loading || (user && status === "loading")) {
    return <div className="gate"><p className="gate-note">Opening the library…</p></div>;
  }

  if (!user) {
    return (
      <div className="gate">
        <h1 className="gate-title">Story Shelf</h1>
        <p className="gate-note">Sign in to see the bookshelf, scan new books and rate old favourites.</p>
        <button type="button" className="btn btn-light" onClick={() => signIn().catch(() => {})}>Sign in with Google</button>
      </div>
    );
  }

  if (status !== "ok" || !household) {
    return (
      <div className="gate">
        <h1 className="gate-title">Not on the library card</h1>
        <p className="gate-note">
          {user.email} isn't a member of this library. Add the address to the household's members list in Firebase, then sign in again.
        </p>
        <button type="button" className="btn btn-light" onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return <>{children({ user, household })}</>;
}
