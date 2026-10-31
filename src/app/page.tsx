import Link from "next/link";
import { CATEGORIES } from "@/lib/jeux";
import { prisma } from "@/lib/prisma";
import { SITE, apercu } from "@/lib/seo";

export const metadata = apercu(
  "Rituel · Tous vos jeux du jour, entre amis",
  "Wordle, Sutom, Worldle… Rituel réunit vos jeux du jour : une routine à cocher, vos scores convertis en points, et des clans pour vous classer entre amis.",
  "/",
);

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Rituel",
  url: SITE,
  description: "Un annuaire de jeux journaliers, une routine à cocher et des clans pour comparer vos résultats.",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  inLanguage: "fr",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  isPartOf: { "@type": "WebSite", name: "ProjectP · 30 jours, 30 projets", url: "https://projectp.fr/" },
};

// Exemples affichés avec les vrais composants du site : ce que le joueur verra une fois inscrit.
const ROUTINE = [
  { nom: "Wordle", etat: "3/6", fait: true },
  { nom: "Sutom", etat: "4/6", fait: true },
  { nom: "L'intrus du jour", etat: "à faire", fait: false },
];

const PODIUM = [
  { nom: "Hugo", points: 389, rang: "2e" },
  { nom: "Léa", points: 412, rang: "1re", premier: true },
  { nom: "Inès", points: 351, rang: "3e" },
];

const CONVERSIONS = [
  { score: "3/6", jeu: "Wordle, en essais", points: 64 },
  { score: "72/100", jeu: "un score sur 100", points: 72 },
  { score: "1:42", jeu: "un temps sous la référence", points: 100 },
];

export default async function Accueil() {
  const [nbJeux, populaires] = await Promise.all([
    prisma.game.count({ where: { valide: true } }),
    prisma.game.findMany({
      where: { valide: true },
      select: { slug: true, nom: true, categorie: true },
      orderBy: [{ epingles: { _count: "desc" } }, { nom: "asc" }],
      take: 8,
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <section className="hero">
        <span className="etiquette">Wordle · Sutom · Framed · Worldle · et {Math.max(nbJeux - 4, 0)} autres</span>
        <h1>
          Tous vos jeux du jour, <span>entre amis.</span>
        </h1>
        <p>
          Chaque matin, le même rituel : un Wordle, un Sutom, un Worldle… Rituel les réunit au même endroit, transforme
          vos scores en points et vous classe avec vos amis.
        </p>
        <div className="actions">
          <Link href="/inscription" className="bouton bouton-principal">Créer mon compte</Link>
          <Link href="/annuaire" className="bouton">Voir les {nbJeux} jeux</Link>
        </div>
        <p className="hero-note">Gratuit. Un pseudo et un mot de passe suffisent, l'e-mail est facultatif.</p>
      </section>

      <section className="etapes" aria-labelledby="comment">
        <h2 id="comment" className="section-titre">Comment ça marche</h2>

        <article className="etape">
          <div className="etape-texte">
            <span className="etape-numero">1</span>
            <h3>Composez votre routine</h3>
            <p>
              Épinglez vos jeux depuis l'annuaire, puis cochez-les au fil de la journée. Un jeu par jour suffit à faire
              grandir votre série 🔥.
            </p>
          </div>
          <figure className="exemple verre" aria-label="Exemple : une routine avec deux jeux faits sur trois et une série de 12 jours">
            <div className="routine-entete">
              <span className="surtitre">Aujourd'hui</span>
              <span className="serie"><span aria-hidden="true">🔥</span> 12 jours</span>
            </div>
            <div className="progression" aria-hidden="true"><span style={{ width: "66%" }} /></div>
            <ul className="liste-routine" aria-hidden="true">
              {ROUTINE.map((j) => (
                <li key={j.nom} className={j.fait ? "ligne-routine faite" : "ligne-routine"}>
                  <div className="ligne-haut">
                    <span className="cocher">
                      <span className="case">{j.fait ? "✓" : ""}</span>
                      {j.nom}
                    </span>
                    <span className="etat">{j.etat}</span>
                  </div>
                </li>
              ))}
            </ul>
          </figure>
        </article>

        <article className="etape">
          <div className="etape-texte">
            <span className="etape-numero">2</span>
            <h3>Collez votre résultat</h3>
            <p>
              Copiez le texte de partage du jeu et collez-le : Rituel reconnaît le jeu et lit votre score. Essais, score
              sur 100 ou chrono, tout devient des points sur 100, comparables d'un jeu à l'autre.
            </p>
          </div>
          <figure className="exemple verre" aria-label="Exemple : un résultat de Wordle en 3 essais converti en 64 points">
            <pre className="exemple-partage">{"Wordle 1 234 3/6\n\n⬛🟨⬛⬛⬛\n⬛🟩🟩⬛🟨\n🟩🟩🟩🟩🟩"}</pre>
            <p className="score-lu">
              <span>Wordle · Score lu : <strong>3/6</strong></span>
              <span className="points">+ 64 points</span>
            </p>
            <ul className="conversions">
              {CONVERSIONS.map((c) => (
                <li key={c.score}>
                  <strong>{c.score}</strong> <span>{c.jeu}</span> <span className="points">{c.points} pts</span>
                </li>
              ))}
            </ul>
          </figure>
        </article>

        <article className="etape">
          <div className="etape-texte">
            <span className="etape-numero">3</span>
            <h3>Défiez vos amis</h3>
            <p>
              Créez un clan, partagez le lien d'invitation, choisissez les jeux du clan. Le classement se joue au jour, à
              la semaine et au mois. Et les clans se mesurent entre eux dans le{" "}
              <Link href="/classement?vue=clans">classement général</Link>.
            </p>
          </div>
          <figure className="exemple verre" aria-label="Exemple : le podium de la semaine d'un clan, Léa première avec 412 points">
            <span className="surtitre">Les Matinaux · semaine</span>
            <ol className="podium" aria-hidden="true">
              {PODIUM.map((p) => (
                <li key={p.nom} className={p.premier ? "marche marche-premier verre" : "marche verre"}>
                  <span className="avatar">{p.nom.charAt(0)}</span>
                  <span className="marche-nom">{p.nom}</span>
                  <span className="marche-points">{p.points}</span>
                  <span className="marche-rang">{p.rang}</span>
                </li>
              ))}
            </ol>
          </figure>
        </article>
      </section>

      {populaires.length > 0 && (
        <section className="populaires" aria-labelledby="populaires">
          <h2 id="populaires" className="section-titre">Les jeux les plus épinglés</h2>
          <ul className="puces">
            {populaires.map((j) => (
              <li key={j.slug}>
                <Link href={`/jeux/${j.slug}`} className="puce">
                  {j.nom} <span className="puce-detail">{CATEGORIES[j.categorie]}</span>
                </Link>
              </li>
            ))}
            <li><Link href="/annuaire" className="puce">Tout l'annuaire →</Link></li>
          </ul>
        </section>
      )}

      <section className="appel verre">
        <h2>Prêt pour votre rituel de demain matin ?</h2>
        <p>Il manque un jeu ? Proposez-le : il rejoint l'annuaire une fois validé.</p>
        <div className="actions">
          <Link href="/inscription" className="bouton bouton-principal">Créer mon compte</Link>
          <Link href="/intrus" className="bouton">Jouer à L'intrus du jour</Link>
        </div>
      </section>
    </>
  );
}
