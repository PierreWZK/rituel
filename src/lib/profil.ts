/** Pseudo public : 3 à 20 lettres (accents compris), chiffres, `_`, `-` ou `.`. */
export const PSEUDO = /^[\p{L}\p{N}_.-]{3,20}$/u;

export function pseudoValide(pseudo: string): boolean {
  return PSEUDO.test(pseudo);
}
