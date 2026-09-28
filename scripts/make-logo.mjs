// Draws the Story Shelf logo: an illustrated bookcase in a storybook frame.
// Writes public/logo.svg (standalone) and components/logoSvg.ts (inline, for the splash).
// Lettering is converted to outlines so it looks right before any web fonts load.
//
//   node scripts/make-logo.mjs
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import opentype from "opentype.js";

const require = createRequire(import.meta.url);
const font = (p) => opentype.loadSync(require.resolve(p));
const HAND = font("@fontsource/patrick-hand-sc/files/patrick-hand-sc-latin-400-normal.woff");
const BOLD = font("@fontsource/andika/files/andika-latin-700-normal.woff");

const W = 640, H = 660;
const INK = "#2a1d14";
const GOLD = "#e2b34a";
const CREAM = "#fbefc8";
const r1 = (n) => Math.round(n * 10) / 10;

// Deterministic wobble so the lettering looks hand-drawn but never changes between builds.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

/** Text as outline paths, centred on cx, with a little hand-lettered wobble per letter. */
function lettering(text, f, size, cx, baseline, { track = 0, wobble = 0 } = {}) {
  const glyphs = [...text].map((ch) => ({ ch, w: f.getAdvanceWidth(ch, size) }));
  const total = glyphs.reduce((s, g) => s + g.w + track, -track);
  let x = cx - total / 2;
  return glyphs.map(({ ch, w }) => {
    const d = f.getPath(ch, 0, 0, size).toPathData(1);
    const t = `translate(${r1(x)} ${r1(baseline + rand() * wobble)}) rotate(${r1(rand() * wobble * 1.4)} ${r1(w / 2)} ${-size * 0.35})`;
    x += w + track;
    return d ? `<path transform="${t}" d="${d}"/>` : "";
  }).join("");
}

/** A single line of text as one path, centred on (0, 0) and shrunk to fit maxW. */
function label(text, f, size, maxW) {
  const w = f.getAdvanceWidth(text, size);
  const s = Math.min(1, maxW / w);
  const d = f.getPath(text, -w / 2, size * 0.35, size).toPathData(1);
  return `<path transform="scale(${r1(s * 100) / 100})" d="${d}"/>`;
}

function star(cx, cy, r, { points = 5, inner = 0.45, rot = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI / points) * i - Math.PI / 2 + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    pts.push(`${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)}`);
  }
  return `M${pts.join("L")}Z`;
}
const sparkle = (cx, cy, r) => star(cx, cy, r, { points: 4, inner: 0.28 });

// ---------- Frame: a storybook cartouche with peaks top and bottom and points at the sides ----------
const L = 40, R = 600, T = 58, B = 610, C = 34, MID = (T + B) / 2;
const frame = [
  `M${W / 2} 22`,
  `C${W / 2 - 22} ${T - 4} ${W / 2 - 80} ${T} ${W / 2 - 130} ${T}`,
  `L${L + C} ${T}`, `A${C} ${C} 0 0 1 ${L} ${T + C}`,
  `L${L} ${MID - 34}`, `Q${L} ${MID} ${L - 22} ${MID}`, `Q${L} ${MID} ${L} ${MID + 34}`,
  `L${L} ${B - C}`, `A${C} ${C} 0 0 1 ${L + C} ${B}`,
  `L${W / 2 - 130} ${B}`, `C${W / 2 - 80} ${B} ${W / 2 - 22} ${B + 4} ${W / 2} ${B + 36}`,
  `C${W / 2 + 22} ${B + 4} ${W / 2 + 80} ${B} ${W / 2 + 130} ${B}`,
  `L${R - C} ${B}`, `A${C} ${C} 0 0 1 ${R} ${B - C}`,
  `L${R} ${MID + 34}`, `Q${R} ${MID} ${R + 22} ${MID}`, `Q${R} ${MID} ${R} ${MID - 34}`,
  `L${R} ${T + C}`, `A${C} ${C} 0 0 1 ${R - C} ${T}`,
  `L${W / 2 + 130} ${T}`, `C${W / 2 + 80} ${T} ${W / 2 + 22} ${T - 4} ${W / 2} 22Z`,
].join("");

// ---------- Books ----------
const FLOOR = 432; // top of the shelf, where the books stand
const BOOKS = [
  { t: "TALES", c: "#d9544a", h: 150, icon: "rabbit" },
  { t: "MAGIC", c: "#3f7fc6", h: 170, icon: "star" },
  { t: "FAIRY", c: "#7fb65a", h: 158, icon: "star" },
  { t: "BEAR", c: "#e9a93c", h: 146, icon: "bear" },
  { t: "STARS", c: "#5a9ad8", h: 174, icon: "star" },
  { t: "MOON", c: "#9a6fc4", h: 162, icon: "moon" },
  { t: "RHYMES", c: "#5fb3a6", h: 178, icon: "heart" },
  { t: "FUN", c: "#e8c450", h: 152, icon: "star" },
  { t: "A-Z", c: "#6ba9dc", h: 140, icon: "dot" },
];
const BW = 27, GAP = 2, X0 = W / 2 - (BOOKS.length * (BW + GAP) - GAP) / 2;

function icon(kind, cx, cy) {
  switch (kind) {
    case "star": return `<path d="${star(cx, cy, 5.5)}" fill="${CREAM}" stroke="${INK}" stroke-width="1"/>`;
    case "moon": return `<path d="M${cx + 2} ${cy - 6}a6.5 6.5 0 1 0 0 12a5 5 0 1 1 0-12z" fill="${CREAM}" stroke="${INK}" stroke-width="1"/>`;
    case "heart": return `<path d="M${cx} ${cy + 5}c-6-4-7-7-5-9s4-1 5 1c1-2 3-3 5-1s1 5-5 9z" fill="#f4a7b9" stroke="${INK}" stroke-width="1"/>`;
    case "bear": return `<g fill="#b9793a" stroke="${INK}" stroke-width="1"><circle cx="${cx - 4}" cy="${cy - 4}" r="2.4"/><circle cx="${cx + 4}" cy="${cy - 4}" r="2.4"/><circle cx="${cx}" cy="${cy}" r="5"/></g><circle cx="${cx}" cy="${cy + 1.5}" r="1.3" fill="${INK}"/>`;
    case "rabbit": return `<g fill="${CREAM}" stroke="${INK}" stroke-width="1"><ellipse cx="${cx - 2}" cy="${cy - 5}" rx="1.6" ry="4"/><ellipse cx="${cx + 2}" cy="${cy - 5}" rx="1.6" ry="4"/><circle cx="${cx}" cy="${cy + 1}" r="4"/></g>`;
    default: return `<circle cx="${cx}" cy="${cy}" r="3" fill="${CREAM}" stroke="${INK}" stroke-width="1"/>`;
  }
}

const books = BOOKS.map((b, i) => {
  const x = X0 + i * (BW + GAP), top = FLOOR - b.h, cx = x + BW / 2;
  const labelMid = top + 18 + (b.h - 48) / 2;
  return `<g class="logo-book" style="--i:${i}">
<rect x="${x}" y="${top}" width="${BW}" height="${b.h}" rx="3" fill="${b.c}" stroke="${INK}" stroke-width="2.2"/>
<rect x="${x + 1.5}" y="${top + 1.5}" width="5" height="${b.h - 3}" fill="#fff" opacity=".18"/>
<rect x="${x + 2}" y="${top - 5}" width="${BW - 4}" height="6" rx="2" fill="${CREAM}" stroke="${INK}" stroke-width="1.6"/>
<path d="M${x + 3} ${top + 10}h${BW - 6}M${x + 3} ${top + 14}h${BW - 6}M${x + 3} ${FLOOR - 10}h${BW - 6}" stroke="${GOLD}" stroke-width="1.6"/>
<g transform="translate(${cx} ${labelMid}) rotate(-90)" fill="${INK}">${label(b.t, BOLD, 15.5, b.h - 58)}</g>
${icon(b.icon, cx, FLOOR - 22)}
</g>`;
}).join("\n");

// ---------- Carved wooden bookcase ----------
const WOOD = "#9a6534", WOOD_DK = "#6e4623", WOOD_LT = "#c28c57";
const bookend = (x, flip) => {
  const w = 28, top = FLOOR - 190;
  return `<g>
<path d="M${x} ${FLOOR}V${top + 14}q0-14 14-14q14 0 14 14V${FLOOR}z" fill="${WOOD}" stroke="${INK}" stroke-width="2.4"/>
<path d="M${x + 6} ${FLOOR - 8}V${top + 18}q0-9 8-9q8 0 8 9V${FLOOR - 8}z" fill="none" stroke="${WOOD_DK}" stroke-width="1.8"/>
<path d="M${x + 14} ${top + 40}c${flip ? 6 : -6} 8 ${flip ? 6 : -6} 18 0 26c${flip ? -6 : 6} 8 ${flip ? -6 : 6} 18 0 26" fill="none" stroke="${WOOD_LT}" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="${x + 14}" cy="${top + 110}" r="4" fill="none" stroke="${WOOD_LT}" stroke-width="1.6"/>
<path d="M${x + 14} ${top + 128}l4 8l-4 8l-4-8z" fill="${WOOD_LT}" opacity=".8"/>
</g>`;
};
const scroll = (cx, cy, dir) => {
  const k = (n) => n * dir;
  return `<path d="M${cx} ${cy}c${k(10)} -10 ${k(30)} -10 ${k(36)} 0c${k(4)} 7 ${k(-4)} 13 ${k(-10)} 9c${k(-5)} -3 ${k(-2)} -9 ${k(3)} -8" fill="none" stroke="${WOOD_LT}" stroke-width="2" stroke-linecap="round"/>`;
};
const shelf = `<g class="logo-shelf">
${bookend(X0 - 32, false)}${bookend(X0 + BOOKS.length * (BW + GAP) + 2, true)}
<path d="M${X0 - 48} ${FLOOR}h${BOOKS.length * (BW + GAP) + 94}v20h-${BOOKS.length * (BW + GAP) + 94}z" fill="${WOOD}" stroke="${INK}" stroke-width="2.4"/>
<path d="M${X0 - 44} ${FLOOR + 4}h${BOOKS.length * (BW + GAP) + 86}" stroke="${WOOD_LT}" stroke-width="2"/>
<path d="M${X0 - 30} ${FLOOR + 20}h${BOOKS.length * (BW + GAP) + 58}l-8 18h-${BOOKS.length * (BW + GAP) + 42}z" fill="${WOOD_DK}" stroke="${INK}" stroke-width="2.2"/>
${scroll(W / 2 - 6, FLOOR + 29, -1)}${scroll(W / 2 + 6, FLOOR + 29, 1)}
<path d="M${W / 2} ${FLOOR + 23}l4 6l-4 6l-4-6z" fill="${GOLD}"/>
<path d="M${X0 - 18} ${FLOOR + 38}l-8 16h14l4-16zM${X0 + BOOKS.length * (BW + GAP) + 16} ${FLOOR + 38}l8 16h-14l-4-16z" fill="${WOOD}" stroke="${INK}" stroke-width="2"/>
<ellipse cx="${W / 2}" cy="${FLOOR + 58}" rx="190" ry="6" fill="#000" opacity=".22"/>
</g>`;

// ---------- The bird, in a yellow cap, waving a wand ----------
const BIRD_X = X0 + 4.5 * (BW + GAP) - 6, BIRD_Y = FLOOR - 174 - 30;
const bird = `<g transform="translate(${BIRD_X} ${BIRD_Y})"><g class="logo-bird">
<path d="M-24 4l-22-9l4 11l-8 7l24 1z" fill="#3669ad" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<ellipse cx="0" cy="4" rx="29" ry="24" fill="#4f8fd8" stroke="${INK}" stroke-width="2.4"/>
<ellipse cx="5" cy="11" rx="17" ry="13" fill="#bfe0f7"/>
<path d="M-6 -2c-22 -6-30 16-8 22c6-6 10-14 8-22z" fill="#3a78c2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M-8 26v8m-4 0h8M8 26v8m-4 0h8" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="6" cy="-24" r="20" fill="#4f8fd8" stroke="${INK}" stroke-width="2.4"/>
<path d="M-13 -33a19 17 0 0 1 37 0z" fill="#f2c230" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M18 -34q16-2 22 5q-12 2-22-1z" fill="#f2c230" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<circle cx="5" cy="-50" r="3" fill="#e0a51a" stroke="${INK}" stroke-width="1.5"/>
<ellipse cx="1" cy="-22" rx="6.5" ry="7.5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
<ellipse cx="15" cy="-22" rx="6.5" ry="7.5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
<circle cx="3" cy="-21" r="3.2" fill="${INK}"/><circle cx="17" cy="-21" r="3.2" fill="${INK}"/>
<circle cx="4.2" cy="-22.6" r="1.1" fill="#fff"/><circle cx="18.2" cy="-22.6" r="1.1" fill="#fff"/>
<path d="M20 -14q10 0 16 4q-6 6-16 3z" fill="#f59a2a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M22 -9q6 1 11-1" fill="none" stroke="${INK}" stroke-width="1.2"/>
<g class="logo-wand">
<path d="M26 4c10-4 16-12 18-20c-8 2-16 8-20 14z" fill="#3a78c2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M40 -8L66 -40" stroke="#7a4a22" stroke-width="4" stroke-linecap="round"/>
<path d="M40 -8L66 -40" stroke="${WOOD_LT}" stroke-width="1.4" stroke-linecap="round"/>
<path d="${star(70, -45, 11, { rot: 12 })}" fill="#ffd650" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
</g>
</g></g>`;

// ---------- Night sky: moon, stars, sparkles and a trail of wand dust ----------
const stars5 = [[196, 186, 13, -8], [236, 210, 8, 10], [148, 300, 9, 0, "#a9c8ef"], [505, 292, 11, 6], [492, 390, 8, -10], [424, 212, 7, 0]];
const sparkles = [[270, 150, 7], [168, 236, 5], [470, 238, 6], [530, 190, 5], [118, 210, 4], [408, 160, 4, "#fff"], [556, 330, 5]];
const dust = [[BIRD_X + 84, BIRD_Y - 58, 2.2], [BIRD_X + 98, BIRD_Y - 70, 1.8], [BIRD_X + 112, BIRD_Y - 78, 2.4], [BIRD_X + 126, BIRD_Y - 82, 1.6], [BIRD_X + 140, BIRD_Y - 84, 2]];
const sky = `<g class="logo-sky">
<g class="logo-moon"><path d="M494 108a34 34 0 1 0 22 58a28 28 0 1 1 -22 -58z" fill="#d7e6f5" stroke="${INK}" stroke-width="2.2"/>
<path d="M486 130q-8 14 2 28" fill="none" stroke="#a9c1dc" stroke-width="2" stroke-linecap="round"/></g>
${stars5.map(([x, y, r, rot, c], i) => `<path class="logo-star" style="--i:${i}" d="${star(x, y, r, { rot })}" fill="${c ?? "#f4c542"}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`).join("")}
${sparkles.map(([x, y, r, c], i) => `<path class="logo-sparkle" style="--i:${i}" d="${sparkle(x, y, r)}" fill="${c ?? "#f7dc86"}"/>`).join("")}
${dust.map(([x, y, r], i) => `<circle class="logo-dust" style="--i:${i}" cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="#ffe7a0"/>`).join("")}
</g>`;

// ---------- Vines and leaves ----------
const leaf = (x, y, a, s = 1, c = "#7fae62") =>
  `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0c6-8 18-8 22 0c-6 8-18 8-22 0z" fill="${c}" stroke="${INK}" stroke-width="1.4"/>`;
const vines = `<g class="logo-vines">
<path d="M${X0 - 56} ${FLOOR + 8}c-30-40-10-80-26-120c-10-26-2-54 20-66" fill="none" stroke="#6d9a55" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${X0 - 70} ${FLOOR - 170}c-14-4-22 4-20 14" fill="none" stroke="#6d9a55" stroke-width="2" stroke-linecap="round"/>
${leaf(X0 - 80, FLOOR - 40, 200, 0.9)}${leaf(X0 - 78, FLOOR - 100, -30, 0.8)}${leaf(X0 - 90, FLOOR - 150, 210, 0.75)}
${leaf(X0 - 62, FLOOR - 16, 160, 1.2, "#8cbf6a")}${leaf(X0 - 70, FLOOR - 6, 210, 1.1, "#6f9f53")}
${leaf(X0 + BOOKS.length * (BW + GAP) + 34, FLOOR - 16, 20, 1.2, "#8cbf6a")}${leaf(X0 + BOOKS.length * (BW + GAP) + 40, FLOOR - 4, -30, 1.1, "#6f9f53")}
<path d="M${X0 + BOOKS.length * (BW + GAP) + 50} ${FLOOR + 6}c20-30 10-60 30-84" fill="none" stroke="#6d9a55" stroke-width="2.2" stroke-linecap="round"/>
${leaf(X0 + BOOKS.length * (BW + GAP) + 64, FLOOR - 40, -50, 0.75)}${leaf(X0 + BOOKS.length * (BW + GAP) + 70, FLOOR - 70, 230, 0.7)}
</g>`;

// ---------- Lettering ----------
const title = lettering("STORY SHELF", HAND, 78, W / 2, 540, { track: 3, wobble: 1.6 });
const sub = lettering("NURSERY BOOK ORGANISER", HAND, 31, W / 2, 584, { track: 1.5, wobble: 0.8 });

const defs = `<defs>
<radialGradient id="ss-bg" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#335a48"/><stop offset="1" stop-color="#22392f" stop-opacity="0"/></radialGradient>
<filter id="ss-glow" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/><feFlood flood-color="#f5c451" flood-opacity=".75"/><feComposite operator="in" in2="blur"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

const body = `${defs}
<path class="logo-frame-fill" d="${frame}" fill="url(#ss-bg)"/>
<path class="logo-frame" pathLength="1" d="${frame}" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linejoin="round"/>
<path class="logo-frame logo-frame-inner" pathLength="1" d="${frame}" fill="none" stroke="#22392f" stroke-width="3" stroke-linejoin="round"/>
<g class="logo-scene" transform="translate(0 -30)">
${sky}
${vines}
${shelf}
${books}
${bird}
</g>
<g class="logo-title" fill="${CREAM}" stroke="#c99a3c" stroke-width="1" filter="url(#ss-glow)">${title}</g>
<g class="logo-sub" fill="#f3d98f" filter="url(#ss-glow)">${sub}</g>`;

const svg = (attrs) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ${attrs}><title>Story Shelf, nursery book organiser</title>${body}</svg>`;

writeFileSync("public/logo.svg", svg(`width="${W}" height="${H}"`) + "\n");
writeFileSync(
  "components/logoSvg.ts",
  `// Generated by scripts/make-logo.mjs. Edit that script and re-run it rather than editing this file.\n` +
    `export const LOGO_SVG = ${JSON.stringify(svg('class="logo-svg" role="img" aria-label="Story Shelf, nursery book organiser"'))};\n`
);
console.log("logo.svg", Math.round(svg("").length / 1024), "KB");
