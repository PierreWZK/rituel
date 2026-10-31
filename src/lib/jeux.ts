import { estFormat, lireTemps, type FormatJeu } from "./partage.ts";

export type ChoixFormat = { format: FormatJeu; formatMax: number | null; formatAutre: string | null };

/**
 * Lit les champs « format » d'un formulaire (proposition ou correction par l'admin).
 * ESSAIS : maximum facultatif (1 à 20) ; SCORE : maximum obligatoire ; TEMPS : temps de référence ; AUTRE : description.
 */
export function lireFormat(champ: (nom: string) => string): ChoixFormat | null {
  const format = champ("format");
  if (!estFormat(format)) return null;
  const max = champ("formatMax") === "" ? null : Number(champ("formatMax"));
  if (format === "ESSAIS") {
    if (max !== null && !(Number.isInteger(max) && max >= 1 && max <= 20)) return null;
    return { format, formatMax: max, formatAutre: null };
  }
  if (format === "SCORE") {
    return max !== null && Number.isInteger(max) && max >= 1 && max <= 100_000 ? { format, formatMax: max, formatAutre: null } : null;
  }
  if (format === "TEMPS") {
    const reference = lireTemps(champ("formatTemps"));
    return reference ? { format, formatMax: reference, formatAutre: null } : null;
  }
  if (format === "AUTRE") {
    const description = champ("formatAutre");
    return description.length >= 3 && description.length <= 120 ? { format, formatMax: null, formatAutre: description } : null;
  }
  return { format, formatMax: null, formatAutre: null };
}

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
