import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CATEGORIES, LANGUES, cleUrl, estCategorie, estLangue, slugifier } from "@/lib/jeux";
import { autoriser } from "@/lib/limite";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Proposer un jeu · Rituel", robots: { index: false } };

async function proposer(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const champ = (nom: string) => String(formData.get(nom) ?? "").trim();
  const nom = champ("nom");
  const url = champ("url");
  const description = champ("description");
  const categorie = champ("categorie");
  const langue = champ("langue");
  const renouvellement = champ("renouvellement") || "à minuit";
  const urlCle = cleUrl(url);

  if (
    nom.length < 2 || nom.length > 60 ||
    !urlCle || url.length > 300 ||
    description.length < 10 || description.length > 280 ||
    !estCategorie(categorie) || !estLangue(langue) ||
    renouvellement.length > 40
  ) {
    redirect("/proposer?erreur=champs");
  }

  const existant = await prisma.game.findUnique({ where: { urlCle } });
  if (existant) redirect(`/jeux/${existant.slug}?doublon=1`);
  if (!autoriser(`proposer:${session.user.id}`, 10, 24 * 3600_000)) redirect("/proposer?erreur=trop");

  const base = slugifier(nom);
  let slug = base;
  for (let n = 2; await prisma.game.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  await prisma.game.create({
    data: { nom, url, urlCle, description, categorie, langue, renouvellement, slug, auteurId: session.user.id },
  });
  redirect(`/jeux/${slug}`);
}

const ERREURS: Record<string, string> = {
  champs: "Un champ est incomplet ou trop long. Vérifiez l'adresse (https://…) et la description (10 à 280 caractères).",
  trop: "Vous avez déjà proposé 10 jeux aujourd'hui. Revenez demain !",
};

export default async function Proposer({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  if (!(await auth())) redirect("/connexion");
  const { erreur } = await searchParams;

  return (
    <section className="connexion verre">
      <h1>Proposer un jeu</h1>
      <p>Un jeu journalier qui manque ? Il apparaît dans l'annuaire dès que vous l'ajoutez.</p>
      {erreur && ERREURS[erreur] && (
        <p className="message message-erreur" role="alert">{ERREURS[erreur]}</p>
      )}
      <form action={proposer} className="formulaire">
        <label htmlFor="nom">Nom du jeu</label>
        <input id="nom" name="nom" required minLength={2} maxLength={60} className="champ" />

        <label htmlFor="url">Adresse</label>
        <input id="url" name="url" type="url" required maxLength={300} placeholder="https://" className="champ" />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" required minLength={10} maxLength={280} rows={3} className="champ" />

        <label htmlFor="categorie">Catégorie</label>
        <select id="categorie" name="categorie" required className="champ">
          {Object.entries(CATEGORIES).map(([cle, libelle]) => (
            <option key={cle} value={cle}>{libelle}</option>
          ))}
        </select>

        <label htmlFor="langue">Langue</label>
        <select id="langue" name="langue" required className="champ">
          {Object.entries(LANGUES).map(([cle, libelle]) => (
            <option key={cle} value={cle}>{libelle}</option>
          ))}
        </select>

        <label htmlFor="renouvellement">Renouvellement</label>
        <input id="renouvellement" name="renouvellement" maxLength={40} placeholder="à minuit" className="champ" />

        <button type="submit" className="bouton bouton-principal">Ajouter à l'annuaire</button>
      </form>
    </section>
  );
}
