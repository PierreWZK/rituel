import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, estAdmin } from "@/auth";
import { CATEGORIES, LANGUES, cleUrl, estCategorie, estLangue, lireFormat, slugifier } from "@/lib/jeux";
import { autoriser } from "@/lib/limite";
import { envoyerMail } from "@/lib/mail";
import { FORMATS, formatTemps } from "@/lib/partage";
import { prisma } from "@/lib/prisma";
import { ChampsFormat } from "./ChampsFormat";

export const metadata: Metadata = { title: "Proposer un jeu · Rituel", robots: { index: false } };

async function proposer(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/proposer");
  // Seul un e-mail vérifié est enregistré : en avoir un suffit.
  if (!session.user.email) redirect("/proposer");

  const champ = (nom: string) => String(formData.get(nom) ?? "").trim();
  const nom = champ("nom");
  const url = champ("url");
  const description = champ("description");
  const categorie = champ("categorie");
  const langue = champ("langue");
  const renouvellement = champ("renouvellement") || "à minuit";
  const urlCle = cleUrl(url);
  const choix = lireFormat(champ);

  if (
    nom.length < 2 || nom.length > 60 ||
    !urlCle || url.length > 300 ||
    description.length < 10 || description.length > 280 ||
    !estCategorie(categorie) || !estLangue(langue) ||
    renouvellement.length > 40 || !choix
  ) {
    redirect("/proposer?erreur=champs");
  }

  const existant = await prisma.game.findUnique({ where: { urlCle } });
  if (existant) redirect(existant.valide ? `/jeux/${existant.slug}?doublon=1` : "/proposer?erreur=attente");
  if (!autoriser(`proposer:${session.user.id}`, 10, 24 * 3600_000)) redirect("/proposer?erreur=trop");

  const base = slugifier(nom);
  let slug = base;
  for (let n = 2; await prisma.game.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  // Un administrateur publie directement ; les autres propositions attendent sa validation.
  const valide = estAdmin(session.user.email);
  await prisma.game.create({
    data: { nom, url, urlCle, description, categorie, langue, renouvellement, slug, auteurId: session.user.id, valide, ...choix },
  });
  if (valide) redirect(`/jeux/${slug}`);

  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const site = process.env.AUTH_URL ?? "http://localhost:3000";
  const detail =
    choix.format === "TEMPS" && choix.formatMax ? ` · référence ${formatTemps(choix.formatMax)}`
    : choix.formatMax ? ` · maximum ${choix.formatMax}`
    : choix.formatAutre ? ` · « ${choix.formatAutre} »`
    : "";
  for (const admin of admins) {
    envoyerMail(
      admin,
      `Nouveau jeu proposé : ${nom}`,
      `${session.user.name} propose « ${nom} » (${url}).\n\n${description}\n\nFormat : ${FORMATS[choix.format]}${detail}\n\nAccepter ou refuser : ${site}/admin`,
    );
  }
  redirect("/proposer?envoye=1");
}

const ERREURS: Record<string, string> = {
  champs: "Un champ est incomplet ou trop long. Vérifiez l'adresse (https://…), la description (10 à 280 caractères) et le format.",
  trop: "Vous avez déjà proposé 10 jeux aujourd'hui. Revenez demain !",
  attente: "Ce jeu a déjà été proposé et attend la validation d'un administrateur.",
};

export default async function Proposer({ searchParams }: { searchParams: Promise<{ erreur?: string; envoye?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/proposer");
  const { erreur, envoye } = await searchParams;

  if (!session.user.email) {
    return (
      <section className="connexion verre">
        <h1>Proposer un jeu</h1>
        <p className="message message-erreur" role="alert">
          Pour proposer un jeu, ajoutez d'abord votre adresse e-mail et validez-la depuis votre profil.
        </p>
        <Link href="/profil#mail" className="bouton bouton-principal">Ajouter mon e-mail</Link>
      </section>
    );
  }

  return (
    <section className="connexion verre">
      <h1>Proposer un jeu</h1>
      <p>Un jeu journalier qui manque ? Il apparaît dans l'annuaire dès qu'un administrateur l'a accepté.</p>
      {envoye && (
        <p className="message message-ok" role="status">
          Merci ! Votre proposition est envoyée. Elle apparaîtra dans l'annuaire une fois acceptée.
        </p>
      )}
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

        <ChampsFormat />

        <button type="submit" className="bouton bouton-principal">Envoyer la proposition</button>
      </form>
    </section>
  );
}
