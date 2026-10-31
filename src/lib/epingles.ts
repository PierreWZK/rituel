import { prisma } from "@/lib/prisma";

/** Épingle ces jeux chez ces joueurs ; les épingles déjà là sont gardées. */
export async function epinglerPour(userIds: string[], gameIds: string[]): Promise<void> {
  if (userIds.length === 0 || gameIds.length === 0) return;
  await prisma.pin.createMany({
    data: userIds.flatMap((userId) => gameIds.map((gameId) => ({ userId, gameId }))),
    skipDuplicates: true,
  });
}

/** À l'arrivée dans un clan, ses jeux rejoignent la routine du nouveau membre. */
export async function epinglerJeuxDuClan(clanId: string, userId: string): Promise<void> {
  const jeux = await prisma.clanGame.findMany({ where: { clanId }, select: { gameId: true } });
  await epinglerPour([userId], jeux.map((j) => j.gameId));
}

/** Jeux imposés par les clans du joueur : ils ne peuvent pas quitter sa routine. */
export async function jeuxImposes(userId: string): Promise<Set<string>> {
  const jeux = await prisma.clanGame.findMany({
    where: { clan: { membres: { some: { userId } } } },
    select: { gameId: true },
  });
  return new Set(jeux.map((j) => j.gameId));
}
