// fr-CA écrit les dates en AAAA-MM-JJ.
const PARIS = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** Le jour en cours à Paris, au format AAAA-MM-JJ : la journée de Rituel bascule à minuit, heure de Paris. */
export function jourParis(date = new Date()): string {
  return PARIS.format(date);
}

export function veille(jour: string): string {
  const date = new Date(`${jour}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Jours consécutifs joués jusqu'à aujourd'hui. Si rien n'est encore joué aujourd'hui, la série d'hier tient toujours. */
export function serie(jours: Iterable<string>, aujourdhui: string): number {
  const joues = new Set(jours);
  let jour = joues.has(aujourdhui) ? aujourdhui : veille(aujourdhui);
  let n = 0;
  while (joues.has(jour)) {
    n++;
    jour = veille(jour);
  }
  return n;
}
