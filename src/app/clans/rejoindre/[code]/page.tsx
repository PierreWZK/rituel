import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Rejoindre un clan · Rituel", robots: { index: false } };

async function rejoindre(formData: FormData) {
  "use server";
  const session = await auth();
  const clan = await prisma.clan.findUnique({ where: { code: String(formData.get("code")) } });
  if (!clan) redirect("/clans?erreur=code");
  if (!session?.user?.id) redirect(`/connexion?suite=/clans/rejoindre/${clan.code}`);
  const cle = { clanId_userId: { clanId: clan.id, userId: session.user.id } };
  await prisma.clanMember.upsert({ where: cle, update: {}, create: cle.clanId_userId });
  redirect(`/clans/${clan.id}`);
}

// Une page de confirmation plutôt qu'une adhésion directe : ouvrir un lien ne doit pas suffire à rejoindre un clan.
export default async function Rejoindre({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clan = await prisma.clan.findUnique({ where: { code: code.toUpperCase() }, include: { _count: { select: { membres: true } } } });
  if (!clan) notFound();
  const session = await auth();

  return (
    <section className="connexion verre">
      <span className="surtitre">Invitation</span>
      <h1>{clan.nom}</h1>
      <p>
        {clan._count.membres} {clan._count.membres > 1 ? "membres comparent" : "membre compare"} déjà leurs jeux du jour.
      </p>
      {session ? (
        <form action={rejoindre} className="formulaire">
          <input type="hidden" name="code" value={clan.code} />
          <button type="submit" className="bouton bouton-principal">Rejoindre le clan</button>
        </form>
      ) : (
        <Link href={`/connexion?suite=/clans/rejoindre/${clan.code}`} className="bouton bouton-principal">
          Se connecter pour rejoindre
        </Link>
      )}
    </section>
  );
}
