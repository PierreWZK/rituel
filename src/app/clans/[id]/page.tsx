import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERIODES, classer, debutPeriode, estPeriode, genererCode } from "@/lib/clans";
import { epinglerPour } from "@/lib/epingles";
import { jourParis, serie } from "@/lib/jour";
import { formatScore } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { Inviter } from "./Inviter";

export const metadata: Metadata = { title: "Clan · Rituel", robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ periode?: string; jeu?: string }> };

async function moi(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/clans");
  return session.user.id;
}

/** Le clan, seulement si l'utilisateur en est membre. */
async function clanDe(clanId: string, userId: string) {
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    include: {
      membres: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      jeux: { include: { game: { select: { id: true, slug: true, nom: true } } } },
    },
  });
  return clan && clan.membres.some((m) => m.userId === userId) ? clan : null;
}

/** Retire un membre ; le plus ancien restant reprend le clan si c'était le fondateur ; un clan vide disparaît. */
async function retirerMembre(clanId: string, userId: string) {
  await prisma.clanMember.delete({ where: { clanId_userId: { clanId, userId } } });
  const suivant = await prisma.clanMember.findFirst({ where: { clanId }, orderBy: { createdAt: "asc" } });
  if (!suivant) await prisma.clan.delete({ where: { id: clanId } });
  else await prisma.clan.updateMany({ where: { id: clanId, fondateurId: userId }, data: { fondateurId: suivant.userId } });
}

async function quitter(formData: FormData) {
  "use server";
  const userId = await moi();
  const clan = await clanDe(String(formData.get("clanId")), userId);
  if (clan) await retirerMembre(clan.id, userId);
  redirect("/clans");
}

async function exclure(formData: FormData) {
  "use server";
  const userId = await moi();
  const clan = await clanDe(String(formData.get("clanId")), userId);
  const cible = String(formData.get("userId"));
  if (clan && clan.fondateurId === userId && cible !== userId && clan.membres.some((m) => m.userId === cible)) {
    await retirerMembre(clan.id, cible);
  }
  revalidatePath(`/clans/${clan?.id}`);
}

async function nouveauCode(formData: FormData) {
  "use server";
  const userId = await moi();
  const clan = await clanDe(String(formData.get("clanId")), userId);
  if (!clan || clan.fondateurId !== userId) return;
  let code = genererCode();
  while (await prisma.clan.findUnique({ where: { code } })) code = genererCode();
  await prisma.clan.update({ where: { id: clan.id }, data: { code } });
  revalidatePath(`/clans/${clan.id}`);
}

/** Le fondateur ajoute un jeu au clan : il s'épingle chez tous les membres. */
async function ajouterJeu(formData: FormData) {
  "use server";
  const userId = await moi();
  const clan = await clanDe(String(formData.get("clanId")), userId);
  const gameId = String(formData.get("gameId"));
  if (!clan || clan.fondateurId !== userId) return;
  if (!(await prisma.game.findFirst({ where: { id: gameId, valide: true } }))) return;
  await prisma.clanGame.upsert({ where: { clanId_gameId: { clanId: clan.id, gameId } }, update: {}, create: { clanId: clan.id, gameId } });
  await epinglerPour(clan.membres.map((m) => m.userId), [gameId]);
  revalidatePath(`/clans/${clan.id}`);
}

/** Retiré du clan, le jeu reste épinglé : chaque membre le garde ou l'enlève lui-même. */
async function retirerJeu(formData: FormData) {
  "use server";
  const userId = await moi();
  const clan = await clanDe(String(formData.get("clanId")), userId);
  if (!clan || clan.fondateurId !== userId) return;
  await prisma.clanGame.deleteMany({ where: { clanId: clan.id, gameId: String(formData.get("gameId")) } });
  revalidatePath(`/clans/${clan.id}`);
}

export default async function PageClan({ params, searchParams }: Props) {
  const userId = await moi();
  const { id } = await params;
  const { periode: p = "jour", jeu: slugJeu } = await searchParams;
  const clan = await clanDe(id, userId);
  if (!clan) notFound();

  const periode = estPeriode(p) ? p : "jour";
  const aujourdhui = jourParis();
  const ids = clan.membres.map((m) => m.userId);
  const dansPeriode = { userId: { in: ids }, jour: { gte: debutPeriode(periode, aujourdhui), lte: aujourdhui } };
  // Avec des jeux du clan, seuls ceux-là comptent ; sans, tous les jeux.
  const idsJeuxClan = clan.jeux.map((j) => j.gameId);
  const jeuFiltre = slugJeu ? await prisma.game.findUnique({ where: { slug: slugJeu }, select: { id: true } }) : null;
  const filtreJeux = jeuFiltre ? { gameId: jeuFiltre.id } : idsJeuxClan.length > 0 ? { gameId: { in: idsJeuxClan } } : {};
  const fondateur = clan.fondateurId === userId;

  const [sommes, jeuxJoues, joues, fil, catalogue] = await Promise.all([
    prisma.result.groupBy({
      by: ["userId"],
      where: { ...dansPeriode, ...filtreJeux },
      _sum: { points: true },
    }),
    idsJeuxClan.length > 0
      ? Promise.resolve(clan.jeux.map((j) => ({ game: j.game })))
      : prisma.result.findMany({ where: dansPeriode, select: { game: { select: { slug: true, nom: true } } }, distinct: ["gameId"] }),
    prisma.result.findMany({ where: { userId: { in: ids } }, select: { userId: true, jour: true }, distinct: ["userId", "jour"] }),
    prisma.result.findMany({
      where: { userId: { in: ids }, jour: aujourdhui },
      include: { user: { select: { name: true } }, game: { select: { nom: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    fondateur
      ? prisma.game.findMany({ where: { valide: true, id: { notIn: idsJeuxClan } }, select: { id: true, nom: true }, orderBy: { nom: "asc" } })
      : Promise.resolve([]),
  ]);

  const points = new Map(sommes.map((s) => [s.userId, s._sum.points ?? 0]));
  const joursParMembre = new Map<string, string[]>();
  for (const r of joues) joursParMembre.set(r.userId, [...(joursParMembre.get(r.userId) ?? []), r.jour]);

  const classement = classer(
    clan.membres
      .map((m) => ({
        id: m.userId,
        nom: m.user.name ?? "?",
        points: points.get(m.userId) ?? 0,
        serie: serie(joursParMembre.get(m.userId) ?? [], aujourdhui),
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
  );
  const podium = [classement[1], classement[0], classement[2]].filter(Boolean);
  const lien = (changes: { periode?: string; jeu?: string | null }) => {
    const q = new URLSearchParams({ periode: changes.periode ?? periode });
    const jeu = changes.jeu === undefined ? slugJeu : changes.jeu;
    if (jeu) q.set("jeu", jeu);
    return `/clans/${clan.id}?${q}`;
  };

  return (
    <>
      <div className="entete-page">
        <div>
          <span className="surtitre">Clan</span>
          <h1 className="titre-page titre-clan">{clan.nom}</h1>
        </div>
        <nav className="onglets" aria-label="Période">
          {Object.entries(PERIODES).map(([cle, libelle]) => (
            <Link key={cle} href={lien({ periode: cle })} className="onglet" aria-current={cle === periode ? "page" : undefined}>
              {libelle}
            </Link>
          ))}
        </nav>
      </div>

      <div className="clan-grille">
        <div>
          <nav className="puces" aria-label="Jeu">
            <Link href={lien({ jeu: null })} className="puce" aria-current={!slugJeu ? "page" : undefined}>Global</Link>
            {jeuxJoues.map(({ game }) => (
              <Link key={game.slug} href={lien({ jeu: game.slug })} className="puce" aria-current={slugJeu === game.slug ? "page" : undefined}>
                {game.nom}
              </Link>
            ))}
          </nav>

          <ol className="podium" aria-label="Podium">
            {podium.map((l) => (
              <li key={l.id} className={l === classement[0] ? "marche marche-premier verre" : "marche verre"}>
                <span className="avatar" aria-hidden="true">{l.nom.charAt(0).toUpperCase()}</span>
                <span className="marche-nom">{l.nom}</span>
                <span className="marche-points">{l.points}</span>
                <span className="marche-rang">{l.rang === 1 ? "1re" : `${l.rang}e`}</span>
              </li>
            ))}
          </ol>

          <ol className="classement verre" aria-label="Classement">
            {classement.map((l) => (
              <li key={l.id} className={l.id === classement[0].id ? "rang rang-premier" : "rang"}>
                <span className="rang-numero">{l.rang}</span>
                <span className="avatar" aria-hidden="true">{l.nom.charAt(0).toUpperCase()}</span>
                <span className="rang-nom">{l.nom}{l.id === userId && " (vous)"}</span>
                {l.serie > 0 && (
                  <span className="rang-serie" title={`Série de ${l.serie} jours`}>
                    <span aria-hidden="true">🔥</span> {l.serie}
                  </span>
                )}
                <span className="rang-points">{l.points}</span>
                {fondateur && l.id !== userId && (
                  <form action={exclure}>
                    <input type="hidden" name="clanId" value={clan.id} />
                    <input type="hidden" name="userId" value={l.id} />
                    <button type="submit" className="lien-discret">Exclure</button>
                  </form>
                )}
              </li>
            ))}
          </ol>
        </div>

        <aside className="clan-cote">
          <section className="verre bloc">
            <h2 className="surtitre">Inviter</h2>
            <Inviter code={clan.code} />
            {fondateur && (
              <form action={nouveauCode}>
                <input type="hidden" name="clanId" value={clan.id} />
                <button type="submit" className="lien-discret">Changer de code</button>
              </form>
            )}
          </section>

          <section className="verre bloc">
            <h2 className="surtitre">Jeux du clan</h2>
            {clan.jeux.length === 0 ? (
              <p className="vide">Aucun : tous les jeux comptent dans le classement.</p>
            ) : (
              <ul className="jeux-clan">
                {clan.jeux.map(({ game }) => (
                  <li key={game.id}>
                    <Link href={`/jeux/${game.slug}`}>{game.nom}</Link>
                    {fondateur && (
                      <form action={retirerJeu}>
                        <input type="hidden" name="clanId" value={clan.id} />
                        <input type="hidden" name="gameId" value={game.id} />
                        <button type="submit" className="lien-discret" aria-label={`Retirer ${game.nom} des jeux du clan`}>Retirer</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="carte-detail">Ils s'ajoutent à la routine de chaque membre et sont seuls comptés dans le classement.</p>
            {fondateur && catalogue.length > 0 && (
              <form action={ajouterJeu} className="ajout-jeu">
                <input type="hidden" name="clanId" value={clan.id} />
                <label htmlFor="jeu-clan" className="visuellement-cache">Jeu à ajouter</label>
                <select id="jeu-clan" name="gameId" className="champ">
                  {catalogue.map((j) => (
                    <option key={j.id} value={j.id}>{j.nom}</option>
                  ))}
                </select>
                <button type="submit" className="bouton">Ajouter</button>
              </form>
            )}
          </section>

          <section className="verre bloc">
            <h2 className="surtitre">Fil des résultats</h2>
            {fil.length === 0 ? (
              <p className="vide">Personne n'a encore joué aujourd'hui.</p>
            ) : (
              <ul className="fil">
                {fil.map((r) => (
                  <li key={r.id} className="fil-ligne">
                    <span className="avatar avatar-petit" aria-hidden="true">{(r.user.name ?? "?").charAt(0).toUpperCase()}</span>
                    <span className="fil-texte">{r.user.name} a fini <strong>{r.game.nom}</strong></span>
                    <span className="fil-score">{formatScore(r)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form action={quitter}>
            <input type="hidden" name="clanId" value={clan.id} />
            <button type="submit" className="lien-discret">Quitter le clan</button>
          </form>
        </aside>
      </div>
    </>
  );
}
