import type { Metadata } from "next";
import { auth } from "@/auth";
import { jourParis } from "@/lib/jour";
import { CLE_INTRUS } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { apercu } from "@/lib/seo";
import { reveler, tirageDuJour } from "./tirage";
import { Jeu } from "./Jeu";

export const metadata: Metadata = apercu(
  "L'intrus du jour · Rituel",
  "Quatre jeux de l'annuaire, un seul n'est pas de la même catégorie. Une tentative par jour.",
  "/intrus",
);

export default async function Intrus() {
  const jour = jourParis();
  const t = await tirageDuJour();
  const session = await auth();

  // Déjà joué aujourd'hui avec un compte : on montre directement la révélation.
  let deja = null;
  if (t && session?.user?.id) {
    const jeu = await prisma.game.findUnique({ where: { urlCle: CLE_INTRUS } });
    const r = jeu && (await prisma.result.findUnique({ where: { userId_gameId_jour: { userId: session.user.id, gameId: jeu.id, jour } } }));
    if (r && r.reussi !== null) deja = reveler(t, r.reussi);
  }

  return (
    <section className="intrus verre">
      <span className="surtitre">Le jeu du jour de Rituel</span>
      <h1 className="titre-page">L'intrus du jour</h1>
      <p className="intrus-consigne">Trois de ces jeux sont de la même catégorie. Lequel est l'intrus ? Une seule tentative.</p>
      {t ? (
        <Jeu cartes={t.cartes.map(({ slug, nom }) => ({ slug, nom }))} jour={jour} connecte={Boolean(session)} deja={deja} />
      ) : (
        <p className="vide">Pas assez de jeux dans l'annuaire pour un tirage aujourd'hui.</p>
      )}
    </section>
  );
}
