import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, estAdmin } from "@/auth";
import { jeuxImposes } from "@/lib/epingles";
import { CATEGORIES, LANGUES, lireFormat } from "@/lib/jeux";
import { FORMATS, formatTemps } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { apercu } from "@/lib/seo";
import { ChampsFormat } from "../../proposer/ChampsFormat";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const jeu = await prisma.game.findUnique({ where: { slug: (await params).slug } });
  if (!jeu) return {};
  // Une proposition en attente n'est pas indexée.
  return jeu.valide ? apercu(`${jeu.nom} · Rituel`, jeu.description, `/jeux/${jeu.slug}`) : { title: `${jeu.nom} · Rituel`, robots: { index: false } };
}

async function epingler(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const slug = String(formData.get("slug"));
  const gameId = String(formData.get("id"));
  const cle = { userId_gameId: { userId: session.user.id, gameId } };
  if (await prisma.pin.findUnique({ where: cle })) {
    // Un jeu de clan reste dans la routine tant qu'on est dans le clan.
    if ((await jeuxImposes(session.user.id)).has(gameId)) redirect(`/jeux/${slug}?impose=1`);
    await prisma.pin.delete({ where: cle });
  } else if (await prisma.game.findFirst({ where: { id: gameId, valide: true } })) {
    await prisma.pin.upsert({ where: cle, update: {}, create: cle.userId_gameId });
  }
  revalidatePath(`/jeux/${slug}`);
}

async function retirer(formData: FormData) {
  "use server";
  const session = await auth();
  if (!estAdmin(session?.user?.email)) redirect("/annuaire");
  await prisma.game.delete({ where: { id: String(formData.get("id")) } });
  redirect("/annuaire");
}

/** L'administrateur corrige le format d'un jeu (proposé ou déjà publié). */
async function corrigerFormat(formData: FormData) {
  "use server";
  const session = await auth();
  if (!estAdmin(session?.user?.email)) redirect("/annuaire");
  const slug = String(formData.get("slug"));
  const choix = lireFormat((nom) => String(formData.get(nom) ?? "").trim());
  if (!choix) redirect(`/jeux/${slug}?erreur=format`);
  await prisma.game.update({ where: { id: String(formData.get("id")) }, data: choix });
  redirect(`/jeux/${slug}?ok=format`);
}

/** « Score sur 100 », « Temps · référence 2:00 »… */
function libelleFormat(jeu: { format: keyof typeof FORMATS; formatMax: number | null; formatAutre: string | null }): string {
  if (jeu.format === "ESSAIS") return jeu.formatMax ? `Essais (sur ${jeu.formatMax})` : "Essais";
  if (jeu.format === "SCORE") return `Score sur ${jeu.formatMax}`;
  if (jeu.format === "TEMPS") return `Temps · 100 points en ${formatTemps(jeu.formatMax ?? 0)} ou moins`;
  if (jeu.format === "AUTRE") return `Fait / pas fait · ${jeu.formatAutre}`;
  return FORMATS[jeu.format];
}

type Recherche = { doublon?: string; impose?: string; erreur?: string; ok?: string };

export default async function FicheJeu({ params, searchParams }: Params & { searchParams: Promise<Recherche> }) {
  const { slug } = await params;
  const { doublon, impose, erreur, ok } = await searchParams;
  const jeu = await prisma.game.findUnique({ where: { slug }, include: { auteur: { select: { name: true } } } });
  if (!jeu) notFound();
  const session = await auth();
  const admin = estAdmin(session?.user?.email);
  if (!jeu.valide && !admin && jeu.auteurId !== session?.user?.id) notFound();
  const [epingle, imposes] = session?.user?.id
    ? await Promise.all([
        prisma.pin.findUnique({ where: { userId_gameId: { userId: session.user.id, gameId: jeu.id } } }),
        jeuxImposes(session.user.id),
      ])
    : [null, new Set<string>()];
  const duClan = imposes.has(jeu.id);

  return (
    <article className="fiche verre">
      {!jeu.valide && (
        <p className="message message-info" role="status">
          En attente de validation : ce jeu n'apparaît pas encore dans l'annuaire.
          {admin && <> <Link href="/admin">Voir les propositions</Link></>}
        </p>
      )}
      {doublon && <p className="message message-info" role="status">Ce jeu est déjà dans l'annuaire : le voici.</p>}
      {impose && <p className="message message-erreur" role="alert">C'est un jeu de votre clan : il reste dans votre routine tant que vous êtes membre.</p>}
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
      <p className="carte-detail">Résultat : {libelleFormat(jeu)}</p>
      <div className="actions">
        <a href={jeu.url} target="_blank" rel="noopener noreferrer" className="bouton bouton-principal">
          Jouer à {jeu.nom} <span aria-hidden="true">↗</span>
        </a>
        {jeu.valide && (
          <form action={epingler}>
            <input type="hidden" name="id" value={jeu.id} />
            <input type="hidden" name="slug" value={jeu.slug} />
            <button type="submit" className="bouton" aria-pressed={Boolean(epingle)} disabled={Boolean(epingle) && duClan}>
              {epingle ? (duClan ? "Jeu de votre clan" : "Retirer de ma routine") : "Épingler à ma routine"}
            </button>
          </form>
        )}
        <Link href="/annuaire" className="lien-action">Retour à l'annuaire</Link>
      </div>
      {jeu.auteur?.name && <p className="carte-detail">Proposé par {jeu.auteur.name}</p>}
      {admin && (
        <div className="admin">
          {erreur && <p className="message message-erreur" role="alert">Format incomplet : vérifiez le champ sous le format choisi.</p>}
          {ok && <p className="message message-ok" role="status">Format enregistré.</p>}
          <form action={corrigerFormat} className="formulaire">
            <input type="hidden" name="id" value={jeu.id} />
            <input type="hidden" name="slug" value={jeu.slug} />
            <ChampsFormat format={jeu.format} formatMax={jeu.formatMax} formatAutre={jeu.formatAutre} />
            <button type="submit" className="bouton">Corriger le format</button>
          </form>
          <form action={retirer}>
            <input type="hidden" name="id" value={jeu.id} />
            <button type="submit" className="bouton bouton-danger">Retirer ce jeu de l'annuaire</button>
          </form>
        </div>
      )}
    </article>
  );
}
