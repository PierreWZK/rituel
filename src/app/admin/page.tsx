import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, estAdmin } from "@/auth";
import { CATEGORIES, LANGUES } from "@/lib/jeux";
import { envoyerMail } from "@/lib/mail";
import { FORMATS, formatTemps } from "@/lib/partage";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Propositions · Rituel", robots: { index: false } };

async function admin(): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/admin");
  if (!estAdmin(session.user.email)) redirect("/");
}

/** Accepte ou refuse une proposition ; l'auteur est prévenu s'il a une adresse. */
async function trancher(formData: FormData) {
  "use server";
  await admin();
  const jeu = await prisma.game.findFirst({
    where: { id: String(formData.get("id")), valide: false },
    include: { auteur: { select: { email: true } } },
  });
  if (!jeu) redirect("/admin");
  const accepte = formData.get("decision") === "accepter";
  if (accepte) await prisma.game.update({ where: { id: jeu.id }, data: { valide: true } });
  else await prisma.game.delete({ where: { id: jeu.id } });

  if (jeu.auteur?.email) {
    const site = process.env.AUTH_URL ?? "http://localhost:3000";
    envoyerMail(
      jeu.auteur.email,
      accepte ? `${jeu.nom} est dans l'annuaire de Rituel` : `Votre proposition « ${jeu.nom} »`,
      accepte
        ? `Bonne nouvelle : « ${jeu.nom} » est accepté et visible dans l'annuaire.\n${site}/jeux/${jeu.slug}`
        : `Merci pour votre proposition. « ${jeu.nom} » n'a pas été retenu pour l'annuaire de Rituel.`,
    );
  }
  revalidatePath("/admin");
  revalidatePath("/annuaire");
}

export default async function Admin() {
  await admin();
  const propositions = await prisma.game.findMany({
    where: { valide: false },
    include: { auteur: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <section className="admin-page">
      <span className="surtitre">Administration</span>
      <h1 className="titre-page">Propositions de jeux</h1>
      {propositions.length === 0 ? (
        <p className="vide verre bloc">Aucune proposition en attente.</p>
      ) : (
        <ul className="propositions">
          {propositions.map((jeu) => (
            <li key={jeu.id} className="verre bloc proposition">
              <div className="proposition-entete">
                <h2>{jeu.nom}</h2>
                <span className="tag">{CATEGORIES[jeu.categorie]}</span>
              </div>
              <a href={jeu.url} target="_blank" rel="noopener noreferrer" className="lien-action">
                {jeu.url} <span aria-hidden="true">↗</span>
              </a>
              <p>{jeu.description}</p>
              <p className="carte-detail">
                {FORMATS[jeu.format]}
                {jeu.format === "TEMPS" && jeu.formatMax ? ` · référence ${formatTemps(jeu.formatMax)}` : ""}
                {jeu.format !== "TEMPS" && jeu.formatMax ? ` · max ${jeu.formatMax}` : ""}
                {jeu.formatAutre ? ` · « ${jeu.formatAutre} »` : ""}
                {" · "}
                {LANGUES[jeu.langue as keyof typeof LANGUES] ?? jeu.langue} · renouvelé {jeu.renouvellement}
                {jeu.auteur?.name && ` · proposé par ${jeu.auteur.name}`}
              </p>
              <div className="actions">
                <form action={trancher}>
                  <input type="hidden" name="id" value={jeu.id} />
                  <button type="submit" name="decision" value="accepter" className="bouton bouton-principal">Accepter</button>
                </form>
                <Link href={`/jeux/${jeu.slug}`} className="bouton">Voir et corriger</Link>
                <form action={trancher}>
                  <input type="hidden" name="id" value={jeu.id} />
                  <button type="submit" name="decision" value="refuser" className="bouton bouton-danger">Refuser</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
