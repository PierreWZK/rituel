import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { jourParis, serie } from "@/lib/jour";
import { jeuxImposes } from "@/lib/epingles";
import { POINTS_FAIT, formatScore, lirePartage, lireTemps, pointsScore, pointsTemps } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { enregistrer } from "@/lib/resultats";

export const metadata: Metadata = { title: "Ma routine · Rituel", robots: { index: false } };

async function utilisateur(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  return session.user.id;
}

/** Coche un jeu épinglé sans score, ou efface le résultat du jour pour le corriger. */
async function basculer(formData: FormData) {
  "use server";
  const userId = await utilisateur();
  const gameId = String(formData.get("gameId"));
  const cle = { userId_gameId_jour: { userId, gameId, jour: jourParis() } };

  if (await prisma.result.findUnique({ where: cle })) {
    await prisma.result.delete({ where: cle });
  } else {
    const pin = await prisma.pin.findUnique({ where: { userId_gameId: { userId, gameId } }, include: { game: { select: { format: true } } } });
    if (pin) {
      // Un jeu sans score (« fait » ou format libre) rapporte ses points dès qu'il est coché.
      const sansScore = pin.game.format === "FAIT" || pin.game.format === "AUTRE";
      // upsert : un double clic ne crée pas deux lignes.
      await prisma.result.upsert({ where: cle, update: {}, create: { ...cle.userId_gameId_jour, points: sansScore ? POINTS_FAIT : 0 } });
    }
  }
  revalidatePath("/routine");
}

/** Lit un texte de partage collé : Rituel reconnaît le jeu tout seul. */
async function coller(formData: FormData) {
  "use server";
  const userId = await utilisateur();
  const lu = lirePartage(String(formData.get("partage") ?? "").slice(0, 2000));
  const jeu = lu && (await prisma.game.findUnique({ where: { urlCle: lu.urlCle } }));
  if (!lu || !jeu) redirect("/routine?erreur=illisible");
  const etat = await enregistrer(userId, jeu.id, lu.score);
  redirect(etat === "ok" ? `/routine?lu=${jeu.slug}` : "/routine?erreur=deja");
}

/** Saisie à la main, selon le format du jeu. */
async function saisir(formData: FormData) {
  "use server";
  const userId = await utilisateur();
  const jeu = await prisma.game.findUnique({ where: { id: String(formData.get("gameId")) } });
  if (!jeu) redirect("/routine?erreur=saisie");
  let etat: "ok" | "deja";

  if (jeu.format === "SCORE" && jeu.formatMax) {
    const valeur = Number(formData.get("valeur"));
    if (!Number.isInteger(valeur) || valeur < 0 || valeur > jeu.formatMax) redirect("/routine?erreur=score");
    etat = await enregistrer(userId, jeu.id, { reussi: true, essais: null, essaisMax: jeu.formatMax, valeur, points: pointsScore(valeur, jeu.formatMax) });
  } else if (jeu.format === "TEMPS" && jeu.formatMax) {
    const secondes = lireTemps(String(formData.get("temps") ?? ""));
    if (!secondes) redirect("/routine?erreur=temps");
    etat = await enregistrer(userId, jeu.id, { reussi: true, essais: null, essaisMax: null, valeur: secondes, points: pointsTemps(secondes, jeu.formatMax) });
  } else {
    const reussi = formData.get("issue") === "reussi";
    // Un maximum fixé par le jeu l'emporte sur celui saisi.
    const essaisMax = jeu.formatMax ?? Number(formData.get("essaisMax"));
    const essais = Number(formData.get("essais"));
    const valide =
      Number.isInteger(essaisMax) && essaisMax >= 1 && essaisMax <= 20 &&
      (!reussi || (Number.isInteger(essais) && essais >= 1 && essais <= essaisMax));
    if (!valide) redirect("/routine?erreur=saisie");
    etat = await enregistrer(userId, jeu.id, { reussi, essais: reussi ? essais : null, essaisMax });
  }
  redirect(etat === "ok" ? "/routine" : "/routine?erreur=deja");
}

const ERREURS: Record<string, string> = {
  illisible: "Texte non reconnu. Pour ce jeu, saisissez le score à la main sur sa ligne.",
  deja: "Un score est déjà enregistré aujourd'hui pour ce jeu. Décochez-le pour le corriger.",
  saisie: "Score incomplet : indiquez le nombre d'essais (1 à 20).",
  score: "Score invalide : un nombre entier entre 0 et le maximum du jeu.",
  temps: "Temps illisible : écrivez-le comme 1:42 (minutes:secondes).",
};

export default async function Routine({ searchParams }: { searchParams: Promise<{ lu?: string; erreur?: string }> }) {
  const userId = await utilisateur();
  const { lu, erreur } = await searchParams;
  const aujourdhui = jourParis();

  const [epingles, duJour, joues, imposes] = await Promise.all([
    prisma.pin.findMany({ where: { userId }, include: { game: true }, orderBy: { createdAt: "asc" } }),
    prisma.result.findMany({ where: { userId, jour: aujourdhui }, include: { game: { select: { slug: true, nom: true } } } }),
    prisma.result.findMany({ where: { userId }, select: { jour: true }, distinct: ["jour"] }),
    jeuxImposes(userId),
  ]);

  const resultats = new Map(duJour.map((r) => [r.gameId, r]));
  const nbFaits = epingles.filter((p) => resultats.has(p.gameId)).length;
  const jours = serie(joues.map((r) => r.jour), aujourdhui);
  const dernier = lu ? duJour.find((r) => r.game.slug === lu) : undefined;

  return (
    <section className="routine verre">
      <div className="routine-entete">
        <div>
          <span className="surtitre">Aujourd'hui</span>
          <h1 className="titre-page">Ma routine</h1>
        </div>
        {jours > 0 && (
          <span className="serie" title="Jours consécutifs avec au moins un jeu joué">
            <span aria-hidden="true">🔥</span> {jours} {jours > 1 ? "jours" : "jour"}
          </span>
        )}
      </div>

      <form action={coller} className="coller">
        <label htmlFor="partage">Coller un résultat</label>
        <textarea id="partage" name="partage" required rows={2} maxLength={2000} className="champ champ-mono" placeholder="Wordle 1 234 3/6" />
        <button type="submit" className="bouton bouton-principal">Lire le score</button>
      </form>
      {dernier && (
        <p className="score-lu" role="status">
          <span>{dernier.game.nom} · Score lu : <strong>{formatScore(dernier)}</strong></span>
          <span className="points">+ {dernier.points} points</span>
        </p>
      )}
      {erreur && ERREURS[erreur] && <p className="message message-erreur" role="alert">{ERREURS[erreur]}</p>}

      {epingles.length === 0 ? (
        <p className="vide">
          Votre routine est vide. <Link href="/annuaire">Épinglez des jeux depuis l'annuaire.</Link>
        </p>
      ) : (
        <>
          <div
            className="progression"
            role="progressbar"
            aria-label="Jeux faits aujourd'hui"
            aria-valuemin={0}
            aria-valuemax={epingles.length}
            aria-valuenow={nbFaits}
          >
            <span style={{ width: `${(nbFaits / epingles.length) * 100}%` }} />
          </div>
          <p className="compte">{nbFaits} / {epingles.length} faits</p>

          <ul className="liste-routine">
            {epingles.map(({ game }) => {
              const resultat = resultats.get(game.id);
              return (
                <li key={game.id} className={resultat ? "ligne-routine faite" : "ligne-routine"}>
                  <div className="ligne-haut">
                    <form action={basculer}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <button type="submit" className="cocher" aria-pressed={Boolean(resultat)}>
                        <span className="case" aria-hidden="true">{resultat ? "✓" : ""}</span>
                        <span className="visuellement-cache">{resultat ? "Décocher" : "Cocher"}</span>
                        {game.nom}
                      </button>
                    </form>
                    {imposes.has(game.id) && <span className="tag tag-clan" title="Jeu de votre clan">clan</span>}
                    <a href={game.url} target="_blank" rel="noopener noreferrer" className="jouer">
                      Jouer<span aria-hidden="true"> ↗</span>
                    </a>
                    <span className="etat">{resultat ? formatScore(resultat) : "à faire"}</span>
                  </div>
                  {(!resultat || resultat.reussi === null) && game.format !== "FAIT" && game.format !== "AUTRE" && (
                    <details className="saisie">
                      <summary>Saisir le score</summary>
                      <form action={saisir} className="saisie-form">
                        <input type="hidden" name="gameId" value={game.id} />
                        {game.format === "SCORE" && game.formatMax ? (
                          <>
                            <span>Score</span>
                            <input name="valeur" type="number" required min={0} max={game.formatMax} aria-label="Score obtenu" className="champ champ-court" />
                            <span>sur {game.formatMax}</span>
                          </>
                        ) : game.format === "TEMPS" && game.formatMax ? (
                          <>
                            <span>Temps</span>
                            <input name="temps" required pattern="\d{1,4}(:\d{1,2}){0,2}" placeholder="1:42" aria-label="Temps (minutes:secondes)" className="champ champ-court" />
                          </>
                        ) : (
                          <>
                            <label><input type="radio" name="issue" value="reussi" defaultChecked /> Réussi en</label>
                            <input name="essais" type="number" min={1} max={game.formatMax ?? 20} defaultValue={Math.min(3, game.formatMax ?? 3)} aria-label="Nombre d'essais" className="champ champ-court" />
                            <span>essais sur</span>
                            {game.formatMax ? (
                              <span>{game.formatMax}</span>
                            ) : (
                              <input name="essaisMax" type="number" min={1} max={20} defaultValue={6} aria-label="Essais possibles" className="champ champ-court" />
                            )}
                            <label><input type="radio" name="issue" value="rate" /> Raté</label>
                          </>
                        )}
                        <button type="submit" className="bouton">Enregistrer</button>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
