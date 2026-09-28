import type { AgeBand, Format } from "./types";

const THEME_RULES: [string, string[]][] = [
  ["Rhymes & songs", ["nursery rhyme", "songs", "singing", "music"]],
  ["Bedtime", ["bedtime", "sleep", "night", "lullab", "goodnight"]],
  ["Vehicles", ["vehicle", "trucks", "cars", "train", "tractor", "transport", "digger", "boats", "aeroplane", "airplane", "fire engine"]],
  ["First words", ["concept", "counting", "numbers", "colour", "color", "alphabet", "shapes", "vocabulary", "first words", "opposites"]],
  ["Animals", ["animal", "zoo", "farm", "bear", "dog", "pupp", "cats", "kitten", "owl", "frog", "pets", "dinosaur", "jungle", "monkey", "elephant", "rabbit", "bunn", "duck", "pig", "lion", "tiger", "caterpillar", "giraffe"]],
  ["Family & feelings", ["family", "love", "emotion", "feeling", "friendship", "mother", "father", "parent", "grandparent", "sibling", "kindness"]],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMPILED = THEME_RULES.map(([theme, words]) => [theme, new RegExp("\\b(" + words.map(escape).join("|") + ")", "i")] as const);

export function guessTheme(subjects: string[], title: string): string {
  const hay = subjects.join(" | ") + " | " + title;
  for (const [theme, re] of COMPILED) if (re.test(hay)) return theme;
  return "Stories";
}

export function guessFormat(physicalFormat: string | null, pages: number | null, subjects: string[]): Format {
  const hay = ((physicalFormat || "") + " " + subjects.join(" ")).toLowerCase();
  if (/board ?book/.test(hay)) return "board";
  if (/picture book/.test(hay) || (pages !== null && pages <= 48)) return "picture";
  return "other";
}

export function guessAge(format: Format, subjects: string[], pages: number | null): AgeBand {
  const hay = subjects.join(" ").toLowerCase();
  if (/\b(baby|babies|infant)/.test(hay)) return "0-1";
  if (format === "board" || /\btoddler/.test(hay)) return "1-2";
  if (format === "picture") return pages !== null && pages <= 24 ? "2-3" : "3-5";
  if (/juvenile|children/.test(hay)) return "3-5";
  return "5+";
}
