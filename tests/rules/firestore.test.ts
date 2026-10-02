import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, FieldPath, getDoc, getDocs, increment, query, setDoc, updateDoc, where,
} from "firebase/firestore";

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
  const find = (db: ReturnType<typeof member>, email: string) =>
    getDocs(query(collection(db, "households"), where("members", "array-contains", email)));

  it("members can find and read it by their email", async () => {
    await assertSucceeds(getDoc(doc(member(), H)));
    await assertSucceeds(find(member(), "alice@example.com"));
  });
  it("outsiders and unverified emails can't read or find it", async () => {
    await assertFails(getDoc(doc(member("m", "mallory@example.com"), H)));
    await assertFails(find(member("m", "mallory@example.com"), "alice@example.com"));
    await assertFails(getDoc(doc(env.authenticatedContext("a", { email: "alice@example.com", email_verified: false }).firestore(), H)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), H)));
  });
  it("anyone signed in can start a library with only themselves in it", async () => {
    const db = member("c", "carol@example.com");
    await assertSucceeds(setDoc(doc(db, "households", "new1"), { members: ["carol@example.com"], childName: "Ada", childBirthMonth: "2024-03" }));
    await assertFails(setDoc(doc(db, "households", "new2"), { members: ["carol@example.com", "alice@example.com"] }));
    await assertFails(setDoc(doc(db, "households", "new3"), { members: ["dave@example.com"] }));
    await assertFails(setDoc(doc(db, "households", "new4"), { members: ["carol@example.com"], childBirthMonth: "March" }));
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "households", "new5"), { members: ["x@example.com"] }));
  });
  it("members can change the child's details and add or remove others", async () => {
    await assertSucceeds(updateDoc(doc(member(), H), { childName: "Jamie", childBirthMonth: "2025-06" }));
    await assertSucceeds(updateDoc(doc(member(), H), { members: arrayUnion("carol@example.com") }));
    await assertSucceeds(updateDoc(doc(member(), H), { members: arrayRemove("bob@example.com") }));
  });
  it("members can't remove themselves, add unknown fields or delete it", async () => {
    await assertFails(updateDoc(doc(member(), H), { members: arrayRemove("alice@example.com") }));
    await assertFails(updateDoc(doc(member(), H), { owner: "alice" }));
    await assertFails(deleteDoc(doc(member(), H)));
  });
  it("outsiders can't change it", async () => {
    await assertFails(updateDoc(doc(member("m", "mallory@example.com"), H), { members: arrayUnion("mallory@example.com") }));
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
  it("books can be put away, lent (with a name) or passed on, and nothing else", async () => {
    const ref = doc(member(), H, "books", "111");
    await assertSucceeds(updateDoc(ref, { status: "away" }));
    await assertSucceeds(updateDoc(ref, { status: "lent", lentTo: "Cousin Ella" }));
    await assertSucceeds(updateDoc(ref, { status: "gone", lentTo: deleteField() }));
    await assertFails(updateDoc(ref, { status: "stolen" }));
    await assertFails(updateDoc(ref, { status: "lent", lentTo: "x".repeat(61) }));
  });
  it("members can remove books", async () => {
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

describe("family wishlist", () => {
  const T = "giftLists/abcdefghijklmnopqrstuv";
  const list = { household: "test", childName: "James", items: [{ key: "zog", isbn: null, title: "Zog", author: "Julia Donaldson", coverUrl: null, ageBand: "2-3" }] };
  const anyone = () => env.unauthenticatedContext().firestore();
  const seed = () => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), T), list));

  it("members can create, update and delete their library's list", async () => {
    await assertSucceeds(setDoc(doc(member(), T), list));
    await assertSucceeds(updateDoc(doc(member(), T), { items: [], childName: "Jamie" }));
    await assertSucceeds(deleteDoc(doc(member(), T)));
  });
  it("outsiders can't create a list for someone else's library, or with a short token", async () => {
    await assertFails(setDoc(doc(member("m", "mallory@example.com"), T), list));
    await assertFails(setDoc(doc(member(), "giftLists/short"), list));
    await assertFails(setDoc(doc(member(), T), { ...list, extra: 1 }));
  });
  it("anyone with the link can read it and its claims, but not list every list", async () => {
    await seed();
    await assertSucceeds(getDoc(doc(anyone(), T)));
    await assertSucceeds(getDocs(collection(anyone(), T, "claims")));
    await assertFails(getDocs(collection(anyone(), "giftLists")));
  });
  it("anyone can claim and unclaim a book with a name", async () => {
    await seed();
    await assertSucceeds(setDoc(doc(anyone(), T, "claims", "zog"), { name: "Grandma" }));
    await assertSucceeds(deleteDoc(doc(anyone(), T, "claims", "zog")));
  });
  it("family can't change the books, make odd claims, claim on a missing list or delete it", async () => {
    await seed();
    await assertFails(updateDoc(doc(anyone(), T), { items: [] }));
    await assertFails(setDoc(doc(anyone(), T, "claims", "zog"), { name: "" }));
    await assertFails(setDoc(doc(anyone(), T, "claims", "zog"), { name: "Gran", note: "x" }));
    await assertFails(setDoc(doc(anyone(), "giftLists/nonexistentnonexistent1", "claims", "zog"), { name: "Gran" }));
    await assertFails(deleteDoc(doc(anyone(), T)));
  });
});
