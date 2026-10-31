import Link from "next/link";
import { auth } from "@/auth";
import { PERIODES, classer, debutPeriode, estPeriode } from "@/lib/clans";
import { jourParis } from "@/lib/jour";
import { prisma } from "@/lib/prisma";
import { apercu } from "@/lib/seo";

export const metadata = apercu(
  "Classements · Rituel",
  "Les meilleurs joueurs et les meilleurs clans de Rituel, au jour, à la semaine et au mois.",
  "/classement",
);

const VUES = { joueurs: "Joueurs", clans: "Clans" } as const;

/** Joueurs qui ont choisi d'apparaître, classés par points sur la période. */
async function classementJoueurs(debut: string, fin: string) {
  const sommes = await prisma.result.groupBy({
    by: ["userId"],
    where: { jour: { gte: debut, lte: fin }, user: { classementPublic: true } },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 100,
  });
  const noms = await prisma.user.findMany({ where: { id: { in: sommes.map((s) => s.userId) } }, select: { id: true, name: true } });
  const nom = new Map(noms.map((u) => [u.id, u.name ?? "?"]));
  return classer(sommes.map((s) => ({ id: s.userId, nom: nom.get(s.userId) ?? "?", points: s._sum.points ?? 0, detail: "" })));
}

/** Moyenne des points par membre ; un clan avec des jeux du clan ne compte que ceux-là, comme sur sa page. */
async function classementClans(debut: string, fin: string) {
  // shortcut: tout est calculé en mémoire, passer à une requête SQL agrégée au-delà de quelques milliers de clans.
  const clans = await prisma.clan.findMany({ select: { id: true, nom: true, membres: { select: { userId: true } }, jeux: { select: { gameId: true } } } });
  const sommes = await prisma.result.groupBy({
    by: ["userId", "gameId"],
    where: { jour: { gte: debut, lte: fin }, user: { clans: { some: {} } } },
    _sum: { points: true },
  });
  const parJoueur = new Map<string, { gameId: string; points: number }[]>();
  for (const s of sommes) parJoueur.set(s.userId, [...(parJoueur.get(s.userId) ?? []), { gameId: s.gameId, points: s._sum.points ?? 0 }]);

  return classer(
    clans
      .filter((c) => c.membres.length > 0)
      .map((c) => {
        const jeux = new Set(c.jeux.map((j) => j.gameId));
        const total = c.membres
          .flatMap((m) => parJoueur.get(m.userId) ?? [])
          .filter((r) => jeux.size === 0 || jeux.has(r.gameId))
          .reduce((t, r) => t + r.points, 0);
        const membres = c.membres.length;
        return { id: c.id, nom: c.nom, points: Math.round(total / membres), detail: `${membres} membre${membres > 1 ? "s" : ""}` };
      })
      .filter((c) => c.points > 0),
  ).slice(0, 100);
}

type Recherche = { vue?: string; periode?: string };

export default async function Classement({ searchParams }: { searchParams: Promise<Recherche> }) {
  const { vue: v = "joueurs", periode: p = "semaine" } = await searchParams;
  const vue = v === "clans" ? "clans" : "joueurs";
  const periode = estPeriode(p) ? p : "semaine";
  const aujourdhui = jourParis();
  const debut = debutPeriode(periode, aujourdhui);
  const [lignes, session] = await Promise.all([
    vue === "clans" ? classementClans(debut, aujourdhui) : classementJoueurs(debut, aujourdhui),
    auth(),
  ]);
  const visible = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { classementPublic: true } }))?.classementPublic
    : true;
  const lien = (changes: Recherche) => `/classement?${new URLSearchParams({ vue, periode, ...changes })}`;

  return (
    <>
      <div className="entete-page">
        <div>
          <span className="surtitre">Classements</span>
          <h1 className="titre-page">{vue === "clans" ? "Les meilleurs clans" : "Les meilleurs joueurs"}</h1>
        </div>
        <nav className="onglets" aria-label="Période">
          {Object.entries(PERIODES).map(([cle, libelle]) => (
            <Link key={cle} href={lien({ periode: cle })} className="onglet" aria-current={cle === periode ? "page" : undefined}>
              {libelle}
            </Link>
          ))}
        </nav>
      </div>

      <nav className="puces" aria-label="Classement">
        {Object.entries(VUES).map(([cle, libelle]) => (
          <Link key={cle} href={lien({ vue: cle })} className="puce" aria-current={cle === vue ? "page" : undefined}>
            {libelle}
          </Link>
        ))}
      </nav>
      <p className="carte-detail classement-note">
        {vue === "clans"
          ? "Moyenne des points par membre. Un clan qui a choisi ses jeux n'est classé que sur ceux-là."
          : "Seuls les joueurs qui l'ont choisi dans leur profil apparaissent ici."}
        {vue === "joueurs" && !visible && <> <Link href="/profil">Apparaître dans le classement</Link></>}
      </p>

      {lignes.length === 0 ? (
        <p className="vide verre bloc">Personne n'a encore marqué de points sur cette période.</p>
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
              <span className="rang-points">{l.points}{vue === "clans" && <span className="rang-detail"> / membre</span>}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
