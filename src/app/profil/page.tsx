import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pseudoValide } from "@/lib/profil";

export const metadata: Metadata = { title: "Mon profil · Rituel", robots: { index: false } };

async function enregistrer(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/profil");
  const bienvenue = formData.get("bienvenue") === "1";
  const retour = bienvenue ? "/profil?bienvenue=1&" : "/profil?";
  const pseudo = String(formData.get("pseudo") ?? "").trim();
  if (!pseudoValide(pseudo)) redirect(`${retour}erreur=format`);

  // Unicité sans tenir compte de la casse : « Léa » et « léa » seraient confondus dans un classement.
  const pris = await prisma.user.findFirst({
    where: { name: { equals: pseudo, mode: "insensitive" }, id: { not: session.user.id } },
    select: { id: true },
  });
  if (pris) redirect(`${retour}erreur=pris`);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: pseudo, classementPublic: formData.get("classementPublic") === "on" },
    });
  } catch {
    // Deux inscriptions simultanées sur le même pseudo : la contrainte unique tranche.
    redirect(`${retour}erreur=pris`);
  }
  revalidatePath("/", "layout");
  redirect(bienvenue ? "/routine" : "/profil?ok=1");
}

const ERREURS: Record<string, string> = {
  format: "Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, _ - ou .",
  pris: "Ce pseudo est déjà pris, choisissez-en un autre.",
};

export default async function Profil({
  searchParams,
}: {
  searchParams: Promise<{ bienvenue?: string; erreur?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/profil");
  const { bienvenue, erreur, ok } = await searchParams;
  const moi = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, classementPublic: true },
  });
  // Le pseudo provisoire « joueur-XXXXXX » n'est pas proposé tel quel à l'arrivée.
  const pseudo = bienvenue && moi.name?.startsWith("joueur-") ? "" : (moi.name ?? "");
  const message = erreur ? ERREURS[erreur] : null;

  return (
    <section className="connexion verre">
      <h1>{bienvenue ? "Bienvenue sur Rituel !" : "Mon profil"}</h1>
      <p>{bienvenue ? "Choisissez le pseudo que verront vos amis dans les clans et les classements." : "Votre pseudo et votre visibilité."}</p>
      {message && (
        <p className="message message-erreur" role="alert">
          {message}
        </p>
      )}
      {ok && (
        <p className="message message-ok" role="status">
          Profil enregistré.
        </p>
      )}
      <form action={enregistrer} className="formulaire">
        {bienvenue && <input type="hidden" name="bienvenue" value="1" />}
        <label htmlFor="pseudo">Pseudo</label>
        <input
          id="pseudo"
          name="pseudo"
          required
          minLength={3}
          maxLength={20}
          defaultValue={pseudo}
          autoComplete="nickname"
          className="champ"
          aria-describedby="pseudo-aide"
        />
        <small id="pseudo-aide">3 à 20 caractères : lettres, chiffres, _ - ou .</small>
        <label className="option">
          <input type="checkbox" name="classementPublic" defaultChecked={moi.classementPublic} />
          Afficher mon profil dans le scoreboard
        </label>
        <button type="submit" className="bouton bouton-principal">
          {bienvenue ? "C'est parti" : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}
