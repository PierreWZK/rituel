export type Score = { reussi: boolean; essais: number | null; essaisMax: number };

export const CLE_INTRUS = "rituel.projectp.fr/intrus";

/** « 3 » sur 6 → réussi en 3 essais ; « X » ou « - » → raté. */
function surMax(symbole: string, essaisMax: number): Score {
  const n = Number(symbole);
  return Number.isInteger(n) && n >= 1 && n <= essaisMax
    ? { reussi: true, essais: n, essaisMax }
    : { reussi: false, essais: null, essaisMax };
}

function sixEssais(texte: string, motif: RegExp): Score | null {
  const m = texte.match(motif);
  return m && surMax(m[1], 6);
}

function framed(texte: string): Score | null {
  if (!/Framed\s+#\d+/i.test(texte)) return null;
  const ligne = texte.match(/🎥([^\n]*)/u);
  if (!ligne) return null;
  const cases = [...ligne[1].matchAll(/🟥|🟩|⬛/gu)].map((m) => m[0]);
  const trouve = cases.indexOf("🟩");
  return trouve >= 0 ? { reussi: true, essais: trouve + 1, essaisMax: 6 } : { reussi: false, essais: null, essaisMax: 6 };
}

function intrus(texte: string): Score | null {
  const m = texte.match(/L'intrus du jour.*?(✅|❌)/u);
  if (!m) return null;
  return m[1] === "✅" ? { reussi: true, essais: 1, essaisMax: 1 } : { reussi: false, essais: null, essaisMax: 1 };
}

// Clé = urlCle du jeu dans l'annuaire. Les autres jeux passent par la saisie manuelle.
const LECTEURS: [string, (texte: string) => Score | null][] = [
  [CLE_INTRUS, intrus],
  ["nytimes.com/games/wordle/index.html", (t) => sixEssais(t, /Wordle\s+[\d\s.,]*\d\s+([1-6X])\/6/i)],
  ["sutom.nocle.fr", (t) => sixEssais(t, /SUTOM\s+#?\d+\s+([1-6-])\/6/i)],
  ["wordle.louan.me", (t) => sixEssais(t, /Le Mot\b.*?\s([1-6X])\/6/i)],
  ["worldle.teuteuf.fr", (t) => sixEssais(t, /#Worldle\s+#\d+.*?\s([1-6X])\/6/i)],
  ["nerdlegame.com", (t) => sixEssais(t, /nerdlegame\s+\d+\s+([1-6X])\/6/i)],
  ["framed.wtf", framed],
];

/** Reconnaît le jeu d'après son texte de partage et en lit le score. */
export function lirePartage(texte: string): { urlCle: string; score: Score } | null {
  for (const [urlCle, lire] of LECTEURS) {
    const score = lire(texte);
    if (score) return { urlCle, score };
  }
  return null;
}

/** 100 au premier essai, 10 au dernier, 0 si raté. */
export function points({ reussi, essais, essaisMax }: Score): number {
  if (!reussi || essais === null) return 0;
  if (essaisMax <= 1) return 100;
  return Math.round(10 + (90 * (essaisMax - essais)) / (essaisMax - 1));
}

/** Formats de résultat d'un jeu (mêmes clés que l'enum Format du schéma). */
export const FORMATS = {
  ESSAIS: "Essais (3/6)",
  SCORE: "Score sur N (72/100)",
  TEMPS: "Temps (1:42)",
  FAIT: "Fait / pas fait",
  AUTRE: "Autre",
} as const;
export type FormatJeu = keyof typeof FORMATS;

export function estFormat(valeur: string): valeur is FormatJeu {
  return Object.hasOwn(FORMATS, valeur);
}

/** Un jeu « fait / pas fait » (ou au format libre) rapporte des points fixes une fois coché. */
export const POINTS_FAIT = 50;

/** 72/100 → 72 points ; borné entre 0 et 100. */
export function pointsScore(valeur: number, max: number): number {
  return max > 0 ? Math.round((100 * Math.min(Math.max(valeur, 0), max)) / max) : 0;
}

/** 100 points au temps de référence ou mieux, 50 au double, et ainsi de suite. */
export function pointsTemps(secondes: number, reference: number): number {
  return secondes > 0 && reference > 0 ? Math.round(100 * Math.min(1, reference / secondes)) : 0;
}

/** « 1:42 », « 1:02:03 » ou « 95 » → secondes ; null si illisible. */
export function lireTemps(texte: string): number | null {
  const parties = texte.trim().split(":");
  if (parties.length > 3 || parties.some((p) => !/^\d{1,4}$/.test(p))) return null;
  const secondes = parties.reduce((total, p) => total * 60 + Number(p), 0);
  return secondes > 0 && secondes < 24 * 3600 ? secondes : null;
}

export function formatTemps(secondes: number): string {
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  const s = String(secondes % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Le score tel qu'affiché : « 3/6 », « X/6 », « 72/100 », « 1:42 » ou « fait ». */
export function formatScore(r: { reussi: boolean | null; essais: number | null; essaisMax: number | null; valeur?: number | null }): string {
  if (r.valeur != null) return r.essaisMax != null ? `${r.valeur}/${r.essaisMax}` : formatTemps(r.valeur);
  if (r.reussi === null || r.essaisMax === null) return "fait";
  return `${r.reussi ? r.essais : "X"}/${r.essaisMax}`;
}
