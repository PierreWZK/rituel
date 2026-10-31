import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { autoriser } from "@/lib/limite";
import { hacher, motDePasseValide } from "@/lib/motdepasse";
import { prisma } from "@/lib/prisma";
import { pseudoValide } from "@/lib/profil";

export const metadata: Metadata = { title: "Créer un compte · Rituel", robots: { index: false } };

function suiteSure(valeur: unknown): string {
  const suite = typeof valeur === "string" ? valeur : "";
  return /^\/(?![/\\])/.test(suite) ? suite : "/routine";
}

async function inscrire(formData: FormData) {
  "use server";
  const suite = suiteSure(formData.get("suite"));
  const retour = (erreur: string) => redirect(`/inscription?erreur=${erreur}&suite=${encodeURIComponent(suite)}`);
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  if (!pseudoValide(pseudo)) retour("pseudo");
  if (!motDePasseValide(motDePasse)) retour("motdepasse");
  if (motDePasse !== formData.get("confirmation")) retour("confirmation");

  // Traefik ajoute l'IP réelle en dernier ; les précédentes peuvent venir du client.
  const ip = (await headers()).get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "local";
  if (!autoriser(`inscription:${ip}`, 5, 3600_000)) retour("trop");

  const pris = await prisma.user.findFirst({ where: { name: { equals: pseudo, mode: "insensitive" } }, select: { id: true } });
  if (pris) retour("pris");
  try {
    await prisma.user.create({
      data: { name: pseudo, motDePasse: await hacher(motDePasse), classementPublic: formData.get("classementPublic") === "on" },
    });
  } catch {
    // Deux inscriptions simultanées sur le même pseudo : la contrainte unique tranche.
    retour("pris");
  }
  await signIn("motdepasse", { pseudo, motDePasse, redirectTo: suite });
}

const ERREURS: Record<string, string> = {
  pseudo: "Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, _ - ou .",
  pris: "Ce pseudo est déjà pris, choisissez-en un autre.",
  motdepasse: "Le mot de passe doit faire au moins 8 caractères.",
  confirmation: "Les deux mots de passe ne correspondent pas.",
  trop: "Trop de comptes créés depuis cette connexion. Réessayez dans une heure.",
};

export default async function Inscription({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; suite?: string }>;
}) {
  const { erreur, suite } = await searchParams;
  if (await auth()) redirect(suiteSure(suite));
  const message = erreur ? ERREURS[erreur] : null;

  return (
    <section className="connexion verre">
      <h1>Créer un compte</h1>
      <p>Un pseudo et un mot de passe suffisent. L'e-mail est facultatif : ajoutez-le plus tard depuis votre profil pour proposer des jeux ou retrouver votre compte.</p>
      {message && (
        <p className="message message-erreur" role="alert">
          {message}
        </p>
      )}
      <form action={inscrire} className="formulaire">
        <input type="hidden" name="suite" value={suiteSure(suite)} />
        <label htmlFor="pseudo">Pseudo</label>
        <input id="pseudo" name="pseudo" required minLength={3} maxLength={20} autoComplete="username" className="champ" aria-describedby="pseudo-aide" />
        <small id="pseudo-aide">3 à 20 caractères : lettres, chiffres, _ - ou .</small>
        <label htmlFor="motDePasse">Mot de passe</label>
        <input id="motDePasse" name="motDePasse" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="champ" />
        <label htmlFor="confirmation">Confirmer le mot de passe</label>
        <input id="confirmation" name="confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="champ" />
        <label className="option">
          <input type="checkbox" name="classementPublic" />
          Afficher mon profil dans le scoreboard
        </label>
        <button type="submit" className="bouton bouton-principal">Créer mon compte</button>
      </form>
      <p className="connexion-autre">
        Déjà un compte ? <Link href={`/connexion?suite=${encodeURIComponent(suiteSure(suite))}`}>Se connecter</Link>
      </p>
    </section>
  );
}
