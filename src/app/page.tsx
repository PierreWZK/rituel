import Link from "next/link";
import { SITE, apercu } from "@/lib/seo";

export const metadata = apercu(
  "Rituel · Tous vos jeux du jour, entre amis",
  "Un annuaire de jeux journaliers, une routine à cocher et des clans pour comparer vos résultats avec vos amis.",
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

export default function Accueil() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <section className="hero">
        <span className="etiquette">Wordle · Sutom · Framed · Worldle</span>
        <h1>
          Tous vos jeux du jour, <span>entre amis.</span>
        </h1>
        <p>Un annuaire que la communauté enrichit, une routine du jour à cocher, et un clan pour comparer vos résultats.</p>
        <div className="actions">
          <Link href="/routine" className="bouton bouton-principal">Composer ma routine</Link>
          <Link href="/clans" className="bouton">Créer un clan</Link>
        </div>
      </section>

      <section className="briques">
        <article className="brique verre">
          <div className="brique-icone" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <h2>Un annuaire vivant</h2>
          <p>Recherche, catégories, langue, heure de renouvellement. N'importe quel compte peut proposer un jeu.</p>
        </article>
        <article className="brique verre">
          <div className="brique-icone" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2>Une routine à cocher</h2>
          <p>Épinglez vos favoris, cochez-les au fil de la journée. Une série 🔥 à faire grandir.</p>
        </article>
        <article className="brique verre">
          <div className="brique-icone" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
              <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
            </svg>
          </div>
          <h2>Des clans entre amis</h2>
          <p>Invitation par lien ou code. Classements du jour, de la semaine et du mois, global et par jeu.</p>
        </article>
      </section>
    </>
  );
}
