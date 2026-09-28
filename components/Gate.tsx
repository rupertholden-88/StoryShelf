"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/auth";
import { createHousehold, useHousehold, validEmail } from "@/lib/household";
import type { Household } from "@/lib/types";
import { LOGO_SVG } from "./logoSvg";

export function Gate({ children }: { children: (ctx: { user: User; household: Household }) => ReactNode }) {
  const { user, loading } = useAuth();
  const { household, status } = useHousehold(user?.email ?? null);

  if (loading || (user && status === "loading")) {
    return <div className="gate"><p className="gate-note">Opening the library…</p></div>;
  }
  if (!user) return <SignIn />;
  if (status === "none") return <StartLibrary user={user} />;
  if (status !== "ok" || !household) return <Trouble />;
  return <>{children({ user, household })}</>;
}

function SignIn() {
  const { error, signIn, sendEmailLink, needsEmailForLink, finishEmailLink } = useAuth();
  const [chooseEmail, setChooseEmail] = useState(false);
  const byEmail = chooseEmail || needsEmailForLink;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) return;
    setBusy(true);
    if (needsEmailForLink) await finishEmailLink(email);
    else setSent(await sendEmailLink(email));
    setBusy(false);
  };

  return (
    <div className="gate gate-signin">
      <div className="gate-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
      <h1 className="visually-hidden">Story Shelf</h1>
      {sent ? (
        <>
          <p className="gate-note">Check your email. We've sent a sign-in link to <strong>{email.trim()}</strong>. Open it on this phone.</p>
          <button type="button" className="text-btn light" onClick={() => setSent(false)}>Use a different address</button>
        </>
      ) : byEmail ? (
        <form className="gate-form" onSubmit={submit}>
          <p className="gate-note">
            {needsEmailForLink ? "Type your email address again to finish signing in." : "We'll email you a link. No password needed."}
          </p>
          <label htmlFor="email" className="visually-hidden">Email address</label>
          <input id="email" className="search" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
          <button type="submit" className="btn btn-light" disabled={busy || !validEmail(email)}>
            {needsEmailForLink ? "Finish signing in" : busy ? "Sending…" : "Email me a sign-in link"}
          </button>
          {!needsEmailForLink && <button type="button" className="text-btn light" onClick={() => setChooseEmail(false)}>Sign in with Google instead</button>}
        </form>
      ) : (
        <>
          <p className="gate-note">Sign in to see the bookshelf, scan new books and rate old favourites.</p>
          <button type="button" className="btn btn-light" onClick={() => signIn()}>Sign in with Google</button>
          <button type="button" className="text-btn light" onClick={() => setChooseEmail(true)}>No Google account? Use your email</button>
        </>
      )}
      {error && <p className="gate-error" role="alert">{error}</p>}
    </div>
  );
}

function StartLibrary({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [childName, setChildName] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const start = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      await createHousehold(user.email!, { childName, childBirthMonth: birthMonth });
    } catch {
      setProblem("The library couldn't be created. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div className="gate gate-start">
      <h1 className="gate-title">Start your library</h1>
      <p className="gate-note">
        Joining someone else's? Ask them to add <strong>{user.email}</strong> in Settings, then come back.
      </p>
      <form className="gate-form" onSubmit={start}>
        <label htmlFor="child" className="gate-label">Child's first name <span>(optional)</span></label>
        <input id="child" className="search" autoComplete="off" maxLength={40} value={childName} onChange={(e) => setChildName(e.target.value)} />
        <label htmlFor="born" className="gate-label">Month they were born <span>(for the age shelves)</span></label>
        <input id="born" className="search" type="month" value={birthMonth} max={new Date().toISOString().slice(0, 7)} onChange={(e) => setBirthMonth(e.target.value)} />
        <button type="submit" className="btn btn-light" disabled={busy}>{busy ? "Setting up…" : "Start our library"}</button>
        {problem && <p className="gate-error" role="alert">{problem}</p>}
      </form>
      <button type="button" className="text-btn light" onClick={() => signOut()}>Sign out</button>
    </div>
  );
}

function Trouble() {
  const { signOut } = useAuth();
  return (
    <div className="gate">
      <h1 className="gate-title">The library didn't open</h1>
      <p className="gate-note">Check your connection and try again. If it keeps happening, sign out and back in.</p>
      <div className="btn-row">
        <button type="button" className="btn btn-light" onClick={() => window.location.reload()}>Try again</button>
        <button type="button" className="btn btn-light" onClick={() => signOut()}>Sign out</button>
      </div>
    </div>
  );
}
