import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteField, doc, FieldPath, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";

// Runs against the Firestore emulator: npm run test:rules
let env: RulesTestEnvironment;
const H = "households/test";

const member = (uid = "alice", email = "alice@example.com") =>
  env.authenticatedContext(uid, { email, email_verified: true }).firestore();

const newBook = (isbn: string) => ({
  isbn, title: "Owl Babies", authors: ["Martin Waddell"], illustrators: ["Patrick Benson"], coverUrl: null,
  subjects: [], theme: "Animals", ageBand: "2-3", format: "picture", pages: 32,
  favourite: false, readCount: 0, ratings: {}, addedBy: "Alice",
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-storyshelf",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(() => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, H), { members: ["alice@example.com", "bob@example.com"], childName: "James" });
    await setDoc(doc(db, H, "books", "111"), { ...newBook("111"), ratings: { bob: { name: "Bob", stars: 4 } } });
    // A book saved before illustrators were recorded.
    const { illustrators: _, ...old } = newBook("222");
    await setDoc(doc(db, H, "books", "222"), old);
  });
});

describe("household", () => {
  it("members can read it, nobody can write it", async () => {
    await assertSucceeds(getDoc(doc(member(), H)));
    await assertFails(updateDoc(doc(member(), H), { members: ["mallory@example.com"] }));
  });
  it("outsiders and unverified emails can't read it", async () => {
    await assertFails(getDoc(doc(member("m", "mallory@example.com"), H)));
    await assertFails(getDoc(doc(env.authenticatedContext("a", { email: "alice@example.com", email_verified: false }).firestore(), H)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), H)));
  });
});

describe("books", () => {
  it("members can add a well-formed book", async () => {
    await assertSucceeds(setDoc(doc(member(), H, "books", "333"), newBook("333")));
  });
  it("rejects unknown fields, a mismatched isbn, an empty title or pre-filled ratings", async () => {
    await assertFails(setDoc(doc(member(), H, "books", "333"), { ...newBook("333"), admin: true }));
    await assertFails(setDoc(doc(member(), H, "books", "333"), newBook("444")));
    await assertFails(setDoc(doc(member(), H, "books", "333"), { ...newBook("333"), title: "" }));
    await assertFails(setDoc(doc(member(), H, "books", "333"), { ...newBook("333"), ratings: { bob: { name: "Bob", stars: 1 } } }));
  });
  it("outsiders can't add books", async () => {
    await assertFails(setDoc(doc(member("m", "mallory@example.com"), H, "books", "333"), newBook("333")));
  });
  it("allows the app's everyday edits", async () => {
    const ref = doc(member(), H, "books", "111");
    await assertSucceeds(updateDoc(ref, { favourite: true }));
    await assertSucceeds(updateDoc(ref, { readCount: increment(1) }));
    await assertSucceeds(updateDoc(ref, { title: "Owl Babies (board book)", authors: ["M. Waddell"] }));
    await assertSucceeds(updateDoc(ref, new FieldPath("ratings", "alice"), { name: "Alice", stars: 5 }));
  });
  it("lets people change only their own rating", async () => {
    const ref = doc(member(), H, "books", "111");
    await assertFails(updateDoc(ref, new FieldPath("ratings", "bob"), { name: "Bob", stars: 1 }));
    await assertFails(updateDoc(ref, { ratings: {} }));
  });
  it("still allows edits to books saved before illustrators existed", async () => {
    const ref = doc(member(), H, "books", "222");
    await assertSucceeds(updateDoc(ref, { favourite: true }));
    await assertSucceeds(updateDoc(ref, new FieldPath("ratings", "alice"), { name: "Alice", stars: 3 }));
    await assertSucceeds(updateDoc(ref, { illustrators: ["Patrick Benson"], lookedUpAt: 1, lookedUpV: 2 }));
  });
  it("rejects edits that add unknown fields or blank the title", async () => {
    const ref = doc(member(), H, "books", "111");
    await assertFails(updateDoc(ref, { hacked: true }));
    await assertFails(updateDoc(ref, { title: "" }));
    await assertFails(updateDoc(ref, { title: deleteField() }));
  });
  it("members can remove books", async () => {
    const { deleteDoc } = await import("firebase/firestore");
    await assertSucceeds(deleteDoc(doc(member(), H, "books", "111")));
  });
});

describe("wishlist", () => {
  const rec = { key: "owlbabies", isbn: null, title: "Owl Babies", author: "Martin Waddell", coverUrl: null, ageBand: "2-3", why: "Like Owl Babies", score: 3 };
  it("accepts a saved suggestion", async () => {
    await assertSucceeds(setDoc(doc(member(), H, "wishlist", "owlbabies"), rec));
  });
  it("rejects unknown fields and outsiders", async () => {
    await assertFails(setDoc(doc(member(), H, "wishlist", "owlbabies"), { ...rec, extra: 1 }));
    await assertFails(setDoc(doc(member("m", "mallory@example.com"), H, "wishlist", "owlbabies"), rec));
  });
});
