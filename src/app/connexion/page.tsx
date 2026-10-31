import type { Metadata } from "next";
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { autoriser } from "@/lib/limite";

export const metadata: Metadata = { title: "Connexion · Rituel", robots: { index: false } };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Page où revenir après la connexion : un chemin interne seulement, jamais un autre site. */
function suiteSure(valeur: unknown): string {
  const suite = typeof valeur === "string" ? valeur : "";
  return /^\/(?![/\\])/.test(suite) ? suite : "/";
}

async function seConnecter(formData: FormData) {
  "use server";
  const suite = suiteSure(formData.get("suite"));
  try {
    await signIn("motdepasse", {
      pseudo: String(formData.get("pseudo") ?? ""),
      motDePasse: String(formData.get("motDePasse") ?? ""),
      redirectTo: suite,
    });
  } catch (e) {
    // signIn signale un échec par une AuthError ; la redirection réussie, elle, doit remonter.
    if (e instanceof AuthError) redirect(`/connexion?erreur=identifiants&suite=${encodeURIComponent(suite)}`);
    throw e;
  }
}

async function demanderLien(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) redirect("/connexion?erreur=email");
  if (!autoriser(email, 5, 15 * 60_000)) redirect("/connexion?erreur=trop");
  await signIn("email", { email, redirectTo: suiteSure(formData.get("suite")) });
}

const ERREURS: Record<string, string> = {
  identifiants: "Pseudo ou mot de passe incorrect.",
  email: "Cette adresse ne semble pas valide.",
  trop: "Trop de demandes pour cette adresse. Réessayez dans un quart d'heure.",
};

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string; error?: string; erreur?: string; suite?: string }>;
}) {
  const { envoye, error, erreur, suite } = await searchParams;
  if (await auth()) redirect(suiteSure(suite));
  // `error` vient d'Auth.js (lien expiré ou déjà utilisé), `erreur` de nos formulaires.
  const message = erreur ? ERREURS[erreur] : error ? "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau." : null;

  return (
    <section className="connexion verre">
      <h1>Se connecter</h1>
      {envoye ? (
        <p className="message message-ok" role="status">
          Lien envoyé ! Ouvrez votre boîte mail et cliquez sur le lien, valable 15 minutes.
        </p>
      ) : (
        <>
          {message && (
            <p className="message message-erreur" role="alert">
              {message}
            </p>
          )}
          <form action={seConnecter} className="formulaire">
            <input type="hidden" name="suite" value={suiteSure(suite)} />
            <label htmlFor="pseudo">Pseudo</label>
            <input id="pseudo" name="pseudo" required maxLength={20} autoComplete="username" className="champ" />
            <label htmlFor="motDePasse">Mot de passe</label>
            <input id="motDePasse" name="motDePasse" type="password" required maxLength={128} autoComplete="current-password" className="champ" />
            <button type="submit" className="bouton bouton-principal">Se connecter</button>
          </form>
          <p className="connexion-autre">
            Pas encore de compte ? <Link href={`/inscription?suite=${encodeURIComponent(suiteSure(suite))}`}>Créer un compte</Link>
          </p>

          <details className="connexion-mail">
            <summary>Se connecter par e-mail (ou mot de passe oublié)</summary>
            <p>Si votre compte a une adresse e-mail validée, on vous envoie un lien de connexion.</p>
            <form action={demanderLien} className="formulaire">
              <input type="hidden" name="suite" value={suiteSure(suite)} />
              <label htmlFor="email">Adresse e-mail</label>
              <input id="email" name="email" type="email" required autoComplete="email" maxLength={254} className="champ" />
              <button type="submit" className="bouton">Recevoir mon lien</button>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
