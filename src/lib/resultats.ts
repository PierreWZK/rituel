import { jourParis } from "@/lib/jour";
import { points, type Score } from "@/lib/partage";
import { prisma } from "@/lib/prisma";

/** Enregistre le score du jour. Un score déjà saisi aujourd'hui n'est pas écrasé ; un jeu seulement coché reçoit son score. */
export async function enregistrer(userId: string, gameId: string, score: Score): Promise<"ok" | "deja"> {
  const cle = { userId_gameId_jour: { userId, gameId, jour: jourParis() } };
  const existant = await prisma.result.findUnique({ where: cle });
  if (existant && existant.reussi !== null) return "deja";
  const donnees = { ...score, points: points(score) };
  await prisma.result.upsert({ where: cle, update: donnees, create: { ...cle.userId_gameId_jour, ...donnees } });
  return "ok";
}
