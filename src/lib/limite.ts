// shortcut: compteur en mémoire, remis à zéro au redémarrage et propre à un seul conteneur ; passer par la base si on en lance plusieurs.
const essais = new Map<string, number[]>();

/** Vrai si `cle` a encore droit à un essai : au plus `max` essais sur les `fenetreMs` dernières millisecondes. */
export function autoriser(cle: string, max: number, fenetreMs: number, maintenant = Date.now()): boolean {
  const recents = (essais.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  const ok = recents.length < max;
  if (ok) recents.push(maintenant);
  essais.set(cle, recents);
  return ok;
}
