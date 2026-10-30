export type Carte = { slug: string; nom: string; categorie: string };

// FNV-1a puis mulberry32 : le même tirage pour tout le monde, d'après la date.
function aleatoire(graine: string): () => number {
  let a = 2166136261;
  for (let i = 0; i < graine.length; i++) a = Math.imul(a ^ graine.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function melanger<T>(liste: T[], hasard: () => number): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Trois jeux d'une même catégorie et un intrus d'une autre, mélangés.
 * shortcut: le tirage dépend de l'annuaire du moment ; un jeu ajouté dans la journée le change. Figer le tirage en base s'il faut l'éviter.
 */
export function tirage(jeux: Carte[], jour: string): { cartes: Carte[]; intrus: string } | null {
  const hasard = aleatoire(`intrus-${jour}`);
  const tries = [...jeux].sort((a, b) => a.slug.localeCompare(b.slug));
  const familles = new Map<string, Carte[]>();
  for (const jeu of tries) familles.set(jeu.categorie, [...(familles.get(jeu.categorie) ?? []), jeu]);

  const possibles = [...familles.keys()].sort().filter((c) => familles.get(c)!.length >= 3);
  if (possibles.length === 0) return null;
  const famille = possibles[Math.floor(hasard() * possibles.length)];
  const autres = tries.filter((j) => j.categorie !== famille);
  if (autres.length === 0) return null;

  const trois = melanger(familles.get(famille)!, hasard).slice(0, 3);
  const intrus = autres[Math.floor(hasard() * autres.length)];
  return { cartes: melanger([...trois, intrus], hasard), intrus: intrus.slug };
}
