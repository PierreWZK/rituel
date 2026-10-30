import type { Metadata } from "next";
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

async function demanderLien(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) redirect("/connexion?erreur=email");
  if (!autoriser(email, 5, 15 * 60_000)) redirect("/connexion?erreur=trop");
  await signIn("email", { email, redirectTo: suiteSure(formData.get("suite")) });
}

const ERREURS: Record<string, string> = {
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
  // `error` vient d'Auth.js (lien expiré ou déjà utilisé), `erreur` de notre formulaire.
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
          <p>Pas de mot de passe : on vous envoie un lien de connexion par e-mail.</p>
          {message && (
            <p className="message message-erreur" role="alert">
              {message}
            </p>
          )}
          <form action={demanderLien} className="formulaire">
            <input type="hidden" name="suite" value={suiteSure(suite)} />
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" maxLength={254} className="champ" />
            <button type="submit" className="bouton bouton-principal">Recevoir mon lien</button>
          </form>
        </>
      )}
    </section>
  );
}
