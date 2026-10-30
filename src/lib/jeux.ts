export const CATEGORIES = {
  MOTS: "Mots",
  GEO: "Géo",
  CHIFFRES: "Chiffres",
  CULTURE: "Culture",
  AUTRES: "Autres",
} as const;

export type CleCategorie = keyof typeof CATEGORIES;

export const LANGUES = { fr: "Français", en: "Anglais" } as const;

export function estCategorie(valeur: string): valeur is CleCategorie {
  return Object.hasOwn(CATEGORIES, valeur);
}

export function estLangue(valeur: string): valeur is keyof typeof LANGUES {
  return Object.hasOwn(LANGUES, valeur);
}

/** « Le Mot (français) » → « le-mot-francais ». */
export function slugifier(nom: string): string {
  const slug = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "jeu";
}

/** Clé de doublon : hôte sans www et chemin sans / final, quels que soient le protocole et la requête. Null si l'adresse n'est pas en http(s). */
export function cleUrl(adresse: string): string | null {
  let url: URL;
  try {
    url = new URL(adresse.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/+$/, "");
}
