import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, estAdmin } from "@/auth";
import { CATEGORIES, LANGUES } from "@/lib/jeux";
import { prisma } from "@/lib/prisma";
import { apercu } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const jeu = await prisma.game.findUnique({ where: { slug: (await params).slug } });
  return jeu ? apercu(`${jeu.nom} · Rituel`, jeu.description, `/jeux/${jeu.slug}`) : {};
}

async function epingler(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const cle = { userId_gameId: { userId: session.user.id, gameId: String(formData.get("id")) } };
  if (await prisma.pin.findUnique({ where: cle })) await prisma.pin.delete({ where: cle });
  else await prisma.pin.upsert({ where: cle, update: {}, create: cle.userId_gameId });
  revalidatePath(`/jeux/${formData.get("slug")}`);
}

async function retirer(formData: FormData) {
  "use server";
  const session = await auth();
  if (!estAdmin(session?.user?.email)) redirect("/annuaire");
  await prisma.game.delete({ where: { id: String(formData.get("id")) } });
  redirect("/annuaire");
}

export default async function FicheJeu({ params, searchParams }: Params & { searchParams: Promise<{ doublon?: string }> }) {
  const { slug } = await params;
  const { doublon } = await searchParams;
  const jeu = await prisma.game.findUnique({ where: { slug }, include: { auteur: { select: { name: true } } } });
  if (!jeu) notFound();
  const session = await auth();
  const epingle =
    session?.user?.id &&
    (await prisma.pin.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId: jeu.id } } }));

  return (
    <article className="fiche verre">
      {doublon && (
        <p className="message message-info" role="status">Ce jeu est déjà dans l'annuaire : le voici.</p>
      )}
      <div className="fiche-entete">
        <span className="tuile tuile-grande" aria-hidden="true">{jeu.nom.charAt(0).toUpperCase()}</span>
        <div>
          <h1 className="titre-page">{jeu.nom}</h1>
          <p className="carte-detail">
            Renouvelé {jeu.renouvellement} · {LANGUES[jeu.langue as keyof typeof LANGUES] ?? jeu.langue}
          </p>
        </div>
        <span className="tag">{CATEGORIES[jeu.categorie]}</span>
      </div>
      <p className="fiche-description">{jeu.description}</p>
      <div className="actions">
        <a href={jeu.url} target="_blank" rel="noopener noreferrer" className="bouton bouton-principal">
          Jouer à {jeu.nom} <span aria-hidden="true">↗</span>
        </a>
        <form action={epingler}>
          <input type="hidden" name="id" value={jeu.id} />
          <input type="hidden" name="slug" value={jeu.slug} />
          <button type="submit" className="bouton" aria-pressed={Boolean(epingle)}>
            {epingle ? "Retirer de ma routine" : "Épingler à ma routine"}
          </button>
        </form>
        <Link href="/annuaire" className="lien-action">Retour à l'annuaire</Link>
      </div>
      {jeu.auteur?.name && <p className="carte-detail">Proposé par {jeu.auteur.name}</p>}
      {estAdmin(session?.user?.email) && (
        <form action={retirer} className="admin">
          <input type="hidden" name="id" value={jeu.id} />
          <button type="submit" className="bouton bouton-danger">Retirer ce jeu de l'annuaire</button>
        </form>
      )}
    </article>
  );
}
