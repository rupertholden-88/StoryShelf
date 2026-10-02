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
- **Family wishlist:** bookmark a suggestion or search result to put it on For you → Wishlist, which also offers
  ideas for about your child's age. "Make a family link" shares a read-only page (no account needed) where
  relatives see the books with shop links and tap "I'm getting this" so nobody doubles up. Books drop off once
  you scan any edition of them.
- **Offline:** the library is cached on the phone, so it opens instantly and still works without signal.

- **Logo and splash:** the illustrated logo is drawn in code by `scripts/make-logo.mjs`, which writes
  `public/logo.svg` and `components/logoSvg.ts`. Edit the script and run `npm run logo`. The splash animates the
  logo's parts (frame, books, bird, stars, title) with CSS in `app/globals.css`.

- **Landscape:** turn a phone or tablet sideways on the Library and it shows just the bookcase, edge to edge.
- **Sign-in:** Google, or an emailed link for people without a Google account. People start or join a library in
  the app; Settings (gear on the Library) has the child's details and who shares the library.

## Setup

1. **Firebase project**
   - Add a Web app and copy its config into `.env.local` (see `.env.example`).
   - Authentication → enable **Google** and **Email/Password → Email link (passwordless sign-in)**. Add your
     Vercel domain under Authentication → Settings → Authorised domains.
   - Firestore → create a database, then publish `firestore.rules` (publish it again whenever it changes).
   - That's it: the first person to sign in starts the library in the app and adds everyone else in Settings.
     (Libraries are found by members' email addresses. The original `households/holden` keeps working.)

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
