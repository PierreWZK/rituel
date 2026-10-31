import { createHash } from "node:crypto";

/** Pseudo public : 3 à 20 lettres (accents compris), chiffres, `_`, `-` ou `.`. */
export const PSEUDO = /^[\p{L}\p{N}_.-]{3,20}$/u;

export function pseudoValide(pseudo: string): boolean {
  return PSEUDO.test(pseudo);
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Seule l'empreinte du jeton de confirmation est stockée : une fuite de la base ne donne pas de lien valide. */
export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}
