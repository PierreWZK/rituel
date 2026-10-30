import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { CATEGORIES, LANGUES, estCategorie, estLangue } from "@/lib/jeux";
import { prisma } from "@/lib/prisma";
import { apercu } from "@/lib/seo";

export const metadata: Metadata = apercu(
  "Annuaire des jeux du jour · Rituel",
  "Wordle, Sutom, Worldle, Framed… tous les jeux quotidiens réunis, par catégorie et par langue.",
  "/annuaire",
);

type Filtres = { q?: string; categorie?: string; langue?: string };

export default async function Annuaire({ searchParams }: { searchParams: Promise<Filtres> }) {
  const { q = "", categorie = "", langue = "" } = await searchParams;
  const recherche = q.trim().slice(0, 60);

  const where: Prisma.GameWhereInput = {};
  if (recherche) {
    where.OR = [
      { nom: { contains: recherche, mode: "insensitive" } },
      { description: { contains: recherche, mode: "insensitive" } },
    ];
  }
  if (estCategorie(categorie)) where.categorie = categorie;
  if (estLangue(langue)) where.langue = langue;

  const jeux = await prisma.game.findMany({ where, orderBy: { nom: "asc" } });

  return (
    <>
      <div className="entete-page">
        <div>
          <span className="surtitre">Annuaire</span>
          <h1 className="titre-page">Les jeux du jour</h1>
        </div>
        <Link href="/proposer" className="lien-action">Proposer un jeu</Link>
      </div>

      <form className="filtres verre" role="search">
        <label className="visuellement-cache" htmlFor="q">Rechercher un jeu</label>
        <input id="q" name="q" type="search" defaultValue={recherche} placeholder="Rechercher un jeu…" maxLength={60} className="champ" />
        <label className="visuellement-cache" htmlFor="categorie">Catégorie</label>
        <select id="categorie" name="categorie" defaultValue={categorie} className="champ">
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORIES).map(([cle, libelle]) => (
            <option key={cle} value={cle}>{libelle}</option>
          ))}
        </select>
        <label className="visuellement-cache" htmlFor="langue">Langue</label>
        <select id="langue" name="langue" defaultValue={langue} className="champ">
          <option value="">Toutes les langues</option>
          {Object.entries(LANGUES).map(([cle, libelle]) => (
            <option key={cle} value={cle}>{libelle}</option>
          ))}
        </select>
        <button type="submit" className="bouton bouton-principal">Filtrer</button>
      </form>

      <p className="compte" role="status">{jeux.length} {jeux.length > 1 ? "jeux" : "jeu"}</p>

      {jeux.length === 0 ? (
        <p className="vide">Aucun jeu ne correspond. <Link href="/proposer">Proposez-le !</Link></p>
      ) : (
        <ul className="grille-jeux">
          {jeux.map((jeu) => (
            <li key={jeu.id}>
              <Link href={`/jeux/${jeu.slug}`} className="carte-jeu verre">
                <span className="tuile" aria-hidden="true">{jeu.nom.charAt(0).toUpperCase()}</span>
                <span className="carte-texte">
                  <span className="carte-nom">{jeu.nom}</span>
                  <span className="carte-detail">Renouvelé {jeu.renouvellement} · {LANGUES[jeu.langue as keyof typeof LANGUES] ?? jeu.langue}</span>
                </span>
                <span className="tag">{CATEGORIES[jeu.categorie]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
