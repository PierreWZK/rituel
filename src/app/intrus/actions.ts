"use server";

import { auth } from "@/auth";
import { jourParis } from "@/lib/jour";
import { CLE_INTRUS } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { enregistrer } from "@/lib/resultats";
import { reveler, tirageDuJour, type Revelation } from "./tirage";

export async function repondre(choix: string, jour: string): Promise<Revelation | "expire"> {
  if (jour !== jourParis()) return "expire";
  const t = await tirageDuJour();
  if (!t) return "expire";
  let reussi = choix === t.intrus;

  const session = await auth();
  const jeu = session?.user?.id && (await prisma.game.findUnique({ where: { urlCle: CLE_INTRUS } }));
  if (session?.user?.id && jeu) {
    const etat = await enregistrer(session.user.id, jeu.id, { reussi, essais: reussi ? 1 : null, essaisMax: 1 });
    if (etat === "deja") {
      // Une seule tentative : on renvoie le résultat déjà enregistré.
      const r = await prisma.result.findUnique({
        where: { userId_gameId_jour: { userId: session.user.id, gameId: jeu.id, jour } },
      });
      reussi = Boolean(r?.reussi);
    }
  }
  return reveler(t, reussi);
}
