# Story Shelf

Our children's bookshelf. Scan a book's barcode to add it, see the library as a real wooden bookcase
(spines or covers, arranged by theme, age or author), rate books, and get suggestions for similar books
with Amazon UK and eBay UK links.

Next.js (App Router) PWA · Firebase Auth + Firestore · hosted on Vercel.

## How it works

- **Scanning:** the browser's `BarcodeDetector` on Android Chrome, ZXing as a fallback on iPhone Safari.
  Only valid ISBN barcodes (978/979) are accepted. You can also type the ISBN.
- **Book details:** Open Library, with Google Books filling gaps. No API keys needed.
- **Shelves:** theme and reading age are guessed from the book's subjects and format (board books go on
  1–2 years) and can be corrected on the scan sheet or the book page. Any author with 4+ books gets their
  own shelf in Theme view.
- **Suggestions:** based on favourites and 4–5 star books, searched on Open Library by author and subject,
  filtered to children's books and anything you already own.
- **Shops:** Amazon UK links search by ISBN (add an Associates tag if you have one). eBay prices come from
  the eBay Browse API through `/api/ebay`, so the keys stay on the server. Only UK sellers are shown, cheapest
  including postage. The route only answers signed-in household members.
- **Search:** the magnifier on the Library opens a search of your shelves (title, author, illustrator, shelf
  or subject) and of Open Library, children's books first. Any result with an ISBN can be added to the shelf
  without scanning, saved, or looked up on Amazon/eBay UK. Each book's page has "See more" for similar books
  (same author, illustrator or subjects) and "More by…" shortcuts into search.
- **Saved books:** bookmark a suggestion to keep it under For you → Saved. It drops off the list once you scan
  any edition of it.
- **Offline:** the library is cached on the phone, so it opens instantly and still works without signal.

- **Logo and splash:** the illustrated logo is drawn in code by `scripts/make-logo.mjs`, which writes
  `public/logo.svg` and `components/logoSvg.ts`. Edit the script and run `npm run logo`. The splash animates the
  logo's parts (frame, books, bird, stars, title) with CSS in `app/globals.css`.

## Setup

1. **Firebase project**
   - Add a Web app and copy its config into `.env.local` (see `.env.example`).
   - Authentication → enable **Google**. Add your Vercel domain under Authentication → Settings → Authorised domains.
   - Firestore → create a database, then publish `firestore.rules` (publish it again whenever it changes).
   - Create the household document `households/<NEXT_PUBLIC_HOUSEHOLD_ID>`:
     ```json
     {
       "members": ["you@gmail.com", "partner@gmail.com"],
       "childName": "James",
       "childBirthMonth": "2025-06"
     }
     ```
     The document id defaults to `holden`; set `NEXT_PUBLIC_HOUSEHOLD_ID` to use another.
     Only these email addresses can read or write the library. `childBirthMonth` powers the
     "James is here" shelf and the age tabs on For you.

2. **eBay (optional)** – create a developer account at developer.ebay.com, make a Production keyset and set
   `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET`. Without them the eBay button still opens a UK search.

3. **Run locally**
   ```bash
   npm install
   npm run dev
   ```
   The camera needs HTTPS on phones, so test scanning on the Vercel preview (or `next dev --experimental-https`).

   Checks, as run in CI:
   ```bash
   npm run typecheck
   npm test              # unit tests
   npm run test:rules    # firestore.rules against the Firestore emulator (needs Java)
   ```

4. **Deploy** – import the repo in Vercel and add the same environment variables. Then on your phone,
   open the site and choose "Add to Home Screen".

## Data model

`households/{id}/books/{isbn13}`: title, authors, coverUrl, subjects, theme, ageBand, format, pages,
favourite, readCount, ratings `{uid: {name, stars}}`, addedAt, addedBy.

`households/{id}/wishlist/{isbn or key}`: suggestions you bookmarked. Scanning a wishlisted book removes it.
