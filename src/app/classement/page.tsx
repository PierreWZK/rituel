import Link from "next/link";
import { auth } from "@/auth";
import { PARTIES_MIN, classer, moyenne, scoreGeneral } from "@/lib/clans";
import { jourParis } from "@/lib/jour";
import { formatScore } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { apercu } from "@/lib/seo";

export const metadata = apercu(
  "Classements · Rituel",
  "Les meilleurs joueurs et les meilleurs clans de Rituel, jeu par jeu chaque jour, et au classement général.",
  "/classement",
);

const VUES = { joueurs: "Joueurs", clans: "Clans" } as const;
const GENERAL = "general";
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

type Ligne = { id: string; nom: string; points: number; detail: string };
type Qui = { classementPublic: true } | { clans: { some: object } };

/** Le score du jour de chaque joueur visible sur ce jeu. */
async function joueursDuJeu(gameId: string, jour: string): Promise<Ligne[]> {
  const resultats = await prisma.result.findMany({
    where: { gameId, jour, user: { classementPublic: true } },
    include: { user: { select: { name: true } } },
    orderBy: { points: "desc" },
    take: 100,
  });
  return resultats.map((r) => ({ id: r.userId, nom: r.user.name ?? "?", points: r.points, detail: formatScore(r) }));
}

/** Moyenne lissée de toutes les parties, à partir de PARTIES_MIN parties. */
async function joueursGeneral(): Promise<Ligne[]> {
  // shortcut: tous les joueurs visibles sont triés en mémoire, passer au tri SQL au-delà de quelques dizaines de milliers.
  const sommes = await prisma.result.groupBy({
    by: ["userId"],
    where: { user: { classementPublic: true } },
    _sum: { points: true },
    _count: { _all: true },
    having: { userId: { _count: { gte: PARTIES_MIN } } },
  });
  const noms = await prisma.user.findMany({ where: { id: { in: sommes.map((s) => s.userId) } }, select: { id: true, name: true } });
  const nom = new Map(noms.map((u) => [u.id, u.name ?? "?"]));
  return sommes
    .map((s) => ({
      id: s.userId,
      nom: nom.get(s.userId) ?? "?",
      points: scoreGeneral(s._sum.points ?? 0, s._count._all),
      detail: pluriel(s._count._all, "partie"),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 100);
}

const membresDesClans = () =>
  prisma.clan.findMany({ select: { id: true, nom: true, membres: { select: { userId: true } }, jeux: { select: { gameId: true } } } });

/** Moyenne du jour des membres qui ont joué à ce jeu. */
async function clansDuJeu(gameId: string, jour: string): Promise<Ligne[]> {
  // shortcut: tous les clans sont chargés en mémoire, passer à une requête SQL agrégée au-delà de quelques milliers de clans.
  const [clans, resultats] = await Promise.all([
    membresDesClans(),
    prisma.result.findMany({ where: { gameId, jour, user: { clans: { some: {} } } }, select: { userId: true, points: true } }),
  ]);
  const points = new Map(resultats.map((r) => [r.userId, r.points]));
  return clans.flatMap((c) => {
    const joues = c.membres.flatMap((m) => (points.has(m.userId) ? [points.get(m.userId)!] : []));
    if (joues.length === 0) return [];
    return [{ id: c.id, nom: c.nom, points: moyenne(joues), detail: `${joues.length} sur ${pluriel(c.membres.length, "membre")}` }];
  });
}

/** Moyenne des scores généraux des membres classés ; un clan avec des jeux du clan ne compte que ceux-là. */
async function clansGeneral(): Promise<Ligne[]> {
  const [clans, sommes] = await Promise.all([
    membresDesClans(),
    prisma.result.groupBy({
      by: ["userId", "gameId"],
      where: { user: { clans: { some: {} } } },
      _sum: { points: true },
      _count: { _all: true },
    }),
  ]);
  const parJoueur = new Map<string, typeof sommes>();
  for (const s of sommes) parJoueur.set(s.userId, [...(parJoueur.get(s.userId) ?? []), s]);

  return clans.flatMap((c) => {
    const jeux = new Set(c.jeux.map((j) => j.gameId));
    const scores = c.membres.flatMap((m) => {
      const lignes = (parJoueur.get(m.userId) ?? []).filter((s) => jeux.size === 0 || jeux.has(s.gameId));
      const parties = lignes.reduce((t, s) => t + s._count._all, 0);
      const total = lignes.reduce((t, s) => t + (s._sum.points ?? 0), 0);
      return parties >= PARTIES_MIN ? [scoreGeneral(total, parties)] : [];
    });
    if (scores.length === 0) return [];
    return [{ id: c.id, nom: c.nom, points: moyenne(scores), detail: `${pluriel(scores.length, "membre")} classé${scores.length > 1 ? "s" : ""}` }];
  });
}

type Recherche = { vue?: string; jeu?: string };

export default async function Classement({ searchParams }: { searchParams: Promise<Recherche> }) {
  const { vue: v, jeu: slugJeu } = await searchParams;
  const vue = v === "clans" ? "clans" : "joueurs";
  const aujourdhui = jourParis();
  const qui: Qui = vue === "clans" ? { clans: { some: {} } } : { classementPublic: true };

  // Les jeux joués aujourd'hui, du plus joué au moins joué.
  const comptes = await prisma.result.groupBy({
    by: ["gameId"],
    where: { jour: aujourdhui, user: qui },
    _count: { _all: true },
    orderBy: { _count: { gameId: "desc" } },
  });
  const infos = await prisma.game.findMany({ where: { id: { in: comptes.map((c) => c.gameId) } }, select: { id: true, slug: true, nom: true } });
  const jeuxDuJour = comptes.flatMap((c) => infos.filter((j) => j.id === c.gameId));
  const general = slugJeu === GENERAL;
  const jeu = general ? null : (jeuxDuJour.find((j) => j.slug === slugJeu) ?? jeuxDuJour[0] ?? null);

  const [brut, session] = await Promise.all([
    general
      ? vue === "clans" ? clansGeneral() : joueursGeneral()
      : !jeu ? Promise.resolve([])
      : vue === "clans" ? clansDuJeu(jeu.id, aujourdhui) : joueursDuJeu(jeu.id, aujourdhui),
    auth(),
  ]);
  const lignes = classer(brut).slice(0, 100);
  const visible = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { classementPublic: true } }))?.classementPublic
    : true;
  const lien = (changes: Recherche) => `/classement?${new URLSearchParams({ vue, jeu: jeu?.slug ?? GENERAL, ...changes })}`;

  const note = !general
    ? !jeu ? "" : vue === "clans"
      ? `Moyenne des points du jour des membres qui ont joué à ${jeu.nom}.`
      : `Les points du jour sur ${jeu.nom}, sur 100.`
    : vue === "clans"
      ? `Moyenne des scores généraux des membres classés. Un clan qui a choisi ses jeux n'est classé que sur ceux-là.`
      : `Moyenne des points par partie, lissée : chacun part de 10 parties fictives à 50 points, donc jouer souvent compte. Il faut ${PARTIES_MIN} parties pour apparaître.`;

  return (
    <>
      <div className="entete-page">
        <div>
          <span className="surtitre">Classements</span>
          <h1 className="titre-page">
            {vue === "clans" ? "Les meilleurs clans" : "Les meilleurs joueurs"}
            {jeu && <> · {jeu.nom}</>}
          </h1>
        </div>
        <nav className="onglets" aria-label="Classement du jour ou général">
          <Link href={lien({ jeu: "" })} className="onglet" aria-current={general ? undefined : "page"}>Aujourd'hui</Link>
          <Link href={lien({ jeu: GENERAL })} className="onglet" aria-current={general ? "page" : undefined}>Général</Link>
        </nav>
      </div>

      <nav className="puces" aria-label="Joueurs ou clans">
        {Object.entries(VUES).map(([cle, libelle]) => (
          <Link key={cle} href={lien({ vue: cle })} className="puce" aria-current={cle === vue ? "page" : undefined}>
            {libelle}
          </Link>
        ))}
      </nav>
      {jeu && jeuxDuJour.length > 1 && (
        <nav className="puces" aria-label="Jeu du jour">
          {jeuxDuJour.map((j) => (
            <Link key={j.id} href={lien({ jeu: j.slug })} className="puce" aria-current={j.id === jeu.id ? "page" : undefined}>
              {j.nom}
            </Link>
          ))}
        </nav>
      )}
      <p className="carte-detail classement-note">
        {note}
        {vue === "joueurs" && !visible && <> <Link href="/profil">Apparaître dans le classement</Link></>}
      </p>

      {lignes.length === 0 ? (
        <p className="vide verre bloc">
          {!general && !jeu ? "Personne n'a encore joué aujourd'hui." : "Personne n'est encore classé ici."}
        </p>
      ) : (
        <ol className="classement verre" aria-label={vue === "clans" ? "Classement des clans" : "Classement des joueurs"}>
          {lignes.map((l) => (
            <li key={l.id} className={l.rang === 1 ? "rang rang-premier" : "rang"}>
              <span className="rang-numero">{l.rang}</span>
              <span className="avatar" aria-hidden="true">{l.nom.charAt(0).toUpperCase()}</span>
              <span className="rang-nom">
                {l.nom}
                {l.id === session?.user?.id && " (vous)"}
                {l.detail && <span className="rang-detail"> · {l.detail}</span>}
              </span>
              <span className="rang-points">{l.points.toLocaleString("fr-FR")}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
