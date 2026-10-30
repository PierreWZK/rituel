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

export function formatScore(r: { reussi: boolean | null; essais: number | null; essaisMax: number | null }): string {
  if (r.reussi === null || r.essaisMax === null) return "fait";
  return `${r.reussi ? r.essais : "X"}/${r.essaisMax}`;
}
