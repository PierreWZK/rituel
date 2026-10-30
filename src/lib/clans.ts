import { randomInt } from "node:crypto";

// Sans 0/O ni 1/I : un code se lit et se dicte sans erreur.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genererCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export const PERIODES = { jour: "Jour", semaine: "Semaine", mois: "Mois" } as const;
export type Periode = keyof typeof PERIODES;

export function estPeriode(valeur: string): valeur is Periode {
  return Object.hasOwn(PERIODES, valeur);
}

/** Premier jour compté : aujourd'hui, le lundi de la semaine ou le 1er du mois (AAAA-MM-JJ). */
export function debutPeriode(periode: Periode, aujourdhui: string): string {
  if (periode === "jour") return aujourdhui;
  if (periode === "mois") return `${aujourdhui.slice(0, 7)}-01`;
  const date = new Date(`${aujourdhui}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/** Trie par points décroissants ; les ex aequo partagent le même rang (1, 2, 2, 4). L'ordre d'entrée départage l'affichage. */
export function classer<T extends { points: number }>(lignes: T[]): (T & { rang: number })[] {
  const triees = [...lignes].sort((a, b) => b.points - a.points);
  let rang = 0;
  return triees.map((ligne, i) => {
    if (i === 0 || triees[i - 1].points !== ligne.points) rang = i + 1;
    return { ...ligne, rang };
  });
}
