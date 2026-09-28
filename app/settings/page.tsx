"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { BottomNav } from "@/components/BottomNav";
import { Gate } from "@/components/Gate";
import { BackIcon } from "@/components/Icons";
import { useAuth } from "@/lib/auth";
import { addMember, normEmail, removeMember, updateChild, validEmail } from "@/lib/household";
import type { Household } from "@/lib/types";

export default function SettingsPage() {
  return <Gate>{({ user, household }) => <Settings user={user} household={household} />}</Gate>;
}

function Settings({ user, household }: { user: User; household: Household }) {
  const { signOut } = useAuth();
  return (
    <>
      <header className="lib-header">
        <Link href="/" className="text-btn light back-link"><BackIcon />Library</Link>
        <h1 className="lib-title">Settings</h1>
      </header>
      <main className="rec-list settings">
        <ChildDetails household={household} />
        <Members user={user} household={household} />
        <section className="settings-card" aria-labelledby="you">
          <h2 id="you" className="section-title">You</h2>
          <p className="section-sub">Signed in as {user.email}</p>
          <button type="button" className="btn btn-outline" onClick={() => signOut()}>Sign out</button>
        </section>
      </main>
      <BottomNav active="library" />
    </>
  );
}

function ChildDetails({ household }: { household: Household }) {
  const [name, setName] = useState(household.childName ?? "");
  const [born, setBorn] = useState(household.childBirthMonth ?? "");
  const [note, setNote] = useState<string | null>(null);

  // Show changes made on another phone.
  useEffect(() => { setName(household.childName ?? ""); setBorn(household.childBirthMonth ?? ""); }, [household.childName, household.childBirthMonth]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateChild(household.id, name, born);
      setNote("Saved.");
    } catch {
      setNote("Couldn't save. Check your connection and try again.");
    }
  };
  const changed = name.trim() !== (household.childName ?? "") || born !== (household.childBirthMonth ?? "");

  return (
    <form className="settings-card" onSubmit={save} aria-labelledby="child">
      <h2 id="child" className="section-title">Your child</h2>
      <label htmlFor="child-name" className="field-label">First name</label>
      <input id="child-name" className="field" maxLength={40} value={name} onChange={(e) => { setName(e.target.value); setNote(null); }} />
      <label htmlFor="child-born" className="field-label">Month they were born</label>
      <input id="child-born" className="field" type="month" max={new Date().toISOString().slice(0, 7)} value={born} onChange={(e) => { setBorn(e.target.value); setNote(null); }} />
      <p className="section-sub">Used for the "{name.trim() || "Your child"} is here" shelf and the age tabs on For you.</p>
      <button type="submit" className="btn btn-dark" disabled={!changed}>Save</button>
      {note && <p className="section-sub" role="status">{note}</p>}
    </form>
  );
}

function Members({ user, household }: { user: User; household: Household }) {
  const [email, setEmail] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const me = normEmail(user.email ?? "");

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const address = normEmail(email);
    if (!validEmail(address)) { setProblem("That doesn't look like an email address."); return; }
    setProblem(null);
    try {
      await addMember(household.id, address);
      setAdded(address);
      setEmail("");
    } catch {
      setProblem("Couldn't add them. Check your connection and try again.");
    }
  };

  const remove = async (address: string) => {
    if (!confirm(`Remove ${address}? They won't be able to open the library any more.`)) return;
    await removeMember(household.id, address).catch(() => setProblem("Couldn't remove them. Try again."));
  };

  return (
    <section className="settings-card" aria-labelledby="family">
      <h2 id="family" className="section-title">Who shares this library</h2>
      <p className="section-sub">Anyone listed can sign in with that address and see, scan and rate the books.</p>
      <ul className="member-list">
        {household.members.map((m) => (
          <li key={m}>
            <span>{m}{normEmail(m) === me && <span className="member-you"> (you)</span>}</span>
            {normEmail(m) !== me && (
              <button type="button" className="text-btn" onClick={() => remove(m)} aria-label={`Remove ${m}`}>Remove</button>
            )}
          </li>
        ))}
      </ul>
      <form className="member-add" onSubmit={add}>
        <label htmlFor="new-member" className="field-label">Add someone</label>
        <div className="btn-row">
          <input id="new-member" className="field" type="email" inputMode="email" autoComplete="off" placeholder="their email address"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn btn-dark btn-small" disabled={!email.trim()}>Add</button>
        </div>
      </form>
      {problem && <p className="form-error" role="alert">{problem}</p>}
      {added && <Invite email={added} childName={household.childName} onDone={() => setAdded(null)} />}
    </section>
  );
}

/** After adding someone: send them the link, with the address they need to sign in with. */
function Invite({ email, childName, onDone }: { email: string; childName?: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.origin;
  const text = `I've added you to ${childName ? `${childName}'s` : "our"} Story Shelf library. Open ${url} and sign in with ${email}.`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Story Shelf", text, url }); onDone(); } catch {}
      return;
    }
    await navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {});
  };

  return (
    <div className="invite" role="status">
      <p className="section-sub"><strong>{email}</strong> can now sign in. Let them know:</p>
      <div className="btn-row">
        <button type="button" className="btn btn-dark btn-small" onClick={share}>{copied ? "Copied" : "Send invite"}</button>
        <a className="btn btn-outline btn-small" href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Story Shelf")}&body=${encodeURIComponent(text)}`}>Email it</a>
        <button type="button" className="text-btn" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
