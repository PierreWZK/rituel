import "server-only";
import { tirage } from "@/lib/intrus";
import { CATEGORIES } from "@/lib/jeux";
import { jourParis } from "@/lib/jour";
import { CLE_INTRUS } from "@/lib/partage";
import { prisma } from "@/lib/prisma";

export type Revelation = { reussi: boolean; intrus: string; categories: Record<string, string> };

// Hors du fichier d'actions : exporté depuis "use server", le tirage deviendrait un point d'accès public qui donne la réponse.
export async function tirageDuJour() {
  const jeux = await prisma.game.findMany({
    where: { urlCle: { not: CLE_INTRUS }, valide: true },
    select: { slug: true, nom: true, categorie: true },
  });
  return tirage(jeux, jourParis());
}

export function reveler(t: NonNullable<Awaited<ReturnType<typeof tirageDuJour>>>, reussi: boolean): Revelation {
  return {
    reussi,
    intrus: t.intrus,
    categories: Object.fromEntries(t.cartes.map((c) => [c.slug, CATEGORIES[c.categorie as keyof typeof CATEGORIES]])),
  };
}
