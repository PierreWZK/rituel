import { randomInt } from "node:crypto";

// Sans 0/O ni 1/I : un code se lit et se dicte sans erreur.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function genererCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

// Le général part de 10 parties fictives à 50 points : un bon départ ne suffit pas, la régularité finit par payer.
const PARTIES_FICTIVES = 10;
const POINTS_FICTIFS = 50;
/** En dessous, un joueur n'apparaît pas au classement général. */
export const PARTIES_MIN = 5;

/** Score général : moyenne lissée des points par partie, à un chiffre après la virgule. */
export function scoreGeneral(total: number, parties: number): number {
  return Math.round((10 * (total + PARTIES_FICTIVES * POINTS_FICTIFS)) / (parties + PARTIES_FICTIVES)) / 10;
}

/** Moyenne simple, à un chiffre après la virgule (0 pour une liste vide). */
export function moyenne(valeurs: number[]): number {
  return valeurs.length ? Math.round((10 * valeurs.reduce((t, v) => t + v, 0)) / valeurs.length) / 10 : 0;
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
