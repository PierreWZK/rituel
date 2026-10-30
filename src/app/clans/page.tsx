import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { genererCode } from "@/lib/clans";
import { autoriser } from "@/lib/limite";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mes clans · Rituel", robots: { index: false } };

async function utilisateur(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?suite=/clans");
  return session.user.id;
}

async function creer(formData: FormData) {
  "use server";
  const userId = await utilisateur();
  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2 || nom.length > 40) redirect("/clans?erreur=nom");
  if (!autoriser(`clan:${userId}`, 5, 24 * 3600_000)) redirect("/clans?erreur=trop");

  let code = genererCode();
  while (await prisma.clan.findUnique({ where: { code } })) code = genererCode();
  const clan = await prisma.clan.create({
    data: { nom, code, fondateurId: userId, membres: { create: { userId } } },
  });
  redirect(`/clans/${clan.id}`);
}

async function rejoindre(formData: FormData) {
  "use server";
  const userId = await utilisateur();
  // Limite les essais : un code se devine moins vite qu'il ne se tape.
  if (!autoriser(`code:${userId}`, 20, 3600_000)) redirect("/clans?erreur=trop");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const clan = code && (await prisma.clan.findUnique({ where: { code } }));
  if (!clan) redirect("/clans?erreur=code");
  const cle = { clanId_userId: { clanId: clan.id, userId } };
  await prisma.clanMember.upsert({ where: cle, update: {}, create: cle.clanId_userId });
  redirect(`/clans/${clan.id}`);
}

const ERREURS: Record<string, string> = {
  nom: "Le nom du clan doit faire entre 2 et 40 caractères.",
  code: "Aucun clan ne porte ce code. Vérifiez-le auprès de votre ami.",
  trop: "Trop de tentatives. Réessayez plus tard.",
};

export default async function Clans({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const userId = await utilisateur();
  const { erreur } = await searchParams;
  const adhesions = await prisma.clanMember.findMany({
    where: { userId },
    include: { clan: { include: { _count: { select: { membres: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="entete-page">
        <div>
          <span className="surtitre">Clans</span>
          <h1 className="titre-page">Mes clans</h1>
        </div>
      </div>

      {erreur && ERREURS[erreur] && <p className="message message-erreur" role="alert">{ERREURS[erreur]}</p>}

      {adhesions.length === 0 ? (
        <p className="vide">Vous n'êtes dans aucun clan. Créez-en un et invitez vos amis, ou entrez le code qu'on vous a donné.</p>
      ) : (
        <ul className="grille-jeux">
          {adhesions.map(({ clan }) => (
            <li key={clan.id}>
              <Link href={`/clans/${clan.id}`} className="carte-jeu verre">
                <span className="tuile" aria-hidden="true">{clan.nom.charAt(0).toUpperCase()}</span>
                <span className="carte-texte">
                  <span className="carte-nom">{clan.nom}</span>
                  <span className="carte-detail">{clan._count.membres} {clan._count.membres > 1 ? "membres" : "membre"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="clans-formulaires">
        <form action={creer} className="formulaire verre bloc">
          <h2>Créer un clan</h2>
          <label htmlFor="nom">Nom du clan</label>
          <input id="nom" name="nom" required minLength={2} maxLength={40} className="champ" />
          <button type="submit" className="bouton bouton-principal">Créer le clan</button>
        </form>
        <form action={rejoindre} className="formulaire verre bloc">
          <h2>Rejoindre un clan</h2>
          <label htmlFor="code">Code d'invitation</label>
          <input id="code" name="code" required maxLength={6} autoComplete="off" className="champ champ-mono champ-code" placeholder="ABC234" />
          <button type="submit" className="bouton">Rejoindre</button>
        </form>
      </div>
    </>
  );
}
