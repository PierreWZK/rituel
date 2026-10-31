import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { autoriser } from "@/lib/limite";
import { envoyerMail } from "@/lib/mail";
import { hacher, motDePasseValide } from "@/lib/motdepasse";
import { prisma } from "@/lib/prisma";
import { EMAIL, empreinteJeton, pseudoValide } from "@/lib/profil";

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

/** Envoie un lien de confirmation : l'adresse n'est enregistrée qu'une fois le lien ouvert. */
async function ajouterMail(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/profil");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) redirect("/profil?erreur=email#mail");
  if (!autoriser(`ajout-mail:${session.user.id}`, 5, 3600_000)) redirect("/profil?erreur=trop#mail");
  const autre = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (autre && autre.id !== session.user.id) redirect("/profil?erreur=mailpris#mail");

  const jeton = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier: `ajout:${session.user.id}:${email}`, token: empreinteJeton(jeton), expires: new Date(Date.now() + 3600_000) },
  });
  const lien = `${process.env.AUTH_URL ?? "http://localhost:3000"}/profil/mail?jeton=${jeton}`;
  envoyerMail(email, "Confirmez votre adresse sur Rituel", `Bonjour,\n\nPour ajouter cette adresse à votre compte Rituel, ouvrez ce lien (valable 1 heure) :\n${lien}\n\nSi vous n'avez rien demandé, ignorez ce message.`);
  redirect("/profil?ok=mail#mail");
}

async function changerMotDePasse(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/profil");
  const motDePasse = String(formData.get("motDePasse") ?? "");
  if (!motDePasseValide(motDePasse)) redirect("/profil?erreur=motdepasse#motdepasse");
  if (motDePasse !== formData.get("confirmation")) redirect("/profil?erreur=confirmation#motdepasse");
  await prisma.user.update({ where: { id: session.user.id }, data: { motDePasse: await hacher(motDePasse) } });
  redirect("/profil?ok=motdepasse#motdepasse");
}

const ERREURS: Record<string, string> = {
  format: "Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, _ - ou .",
  pris: "Ce pseudo est déjà pris, choisissez-en un autre.",
  email: "Cette adresse ne semble pas valide.",
  mailpris: "Cette adresse est déjà utilisée par un autre compte.",
  trop: "Trop de demandes. Réessayez dans une heure.",
  jeton: "Ce lien de confirmation a expiré ou a déjà servi.",
  motdepasse: "Le mot de passe doit faire au moins 8 caractères.",
  confirmation: "Les deux mots de passe ne correspondent pas.",
};

const SUCCES: Record<string, string> = {
  "1": "Profil enregistré.",
  mail: "Lien envoyé ! Ouvrez votre boîte mail pour confirmer l'adresse (valable 1 heure).",
  mailok: "Adresse e-mail confirmée.",
  motdepasse: "Mot de passe enregistré.",
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
    select: { name: true, classementPublic: true, email: true, motDePasse: true },
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
      {ok && SUCCES[ok] && (
        <p className="message message-ok" role="status">
          {SUCCES[ok]}
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

      {!bienvenue && (
        <>
          <h2 id="mail" className="profil-titre">E-mail</h2>
          <p>
            {moi.email
              ? <>Adresse validée : <strong>{moi.email}</strong>. Vous pouvez proposer des jeux et vous connecter par lien.</>
              : "Facultative. Une adresse validée permet de proposer des jeux et de retrouver votre compte."}
          </p>
          <form action={ajouterMail} className="formulaire">
            <label htmlFor="email">{moi.email ? "Changer d'adresse" : "Adresse e-mail"}</label>
            <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="champ" />
            <button type="submit" className="bouton">Recevoir le lien de confirmation</button>
          </form>

          <h2 id="motdepasse" className="profil-titre">Mot de passe</h2>
          <p>{moi.motDePasse ? "Changez votre mot de passe." : "Ajoutez un mot de passe pour vous connecter avec votre pseudo."}</p>
          <form action={changerMotDePasse} className="formulaire">
            <label htmlFor="nouveau">Nouveau mot de passe</label>
            <input id="nouveau" name="motDePasse" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="champ" />
            <label htmlFor="confirmation">Confirmer</label>
            <input id="confirmation" name="confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="champ" />
            <button type="submit" className="bouton">Enregistrer le mot de passe</button>
          </form>
        </>
      )}
    </section>
  );
}
