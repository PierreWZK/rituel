import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { empreinteJeton } from "@/lib/profil";

/** Lien reçu par mail : enregistre l'adresse comme validée, puis renvoie au profil. */
export async function GET(requete: NextRequest) {
  const jeton = requete.nextUrl.searchParams.get("jeton") ?? "";
  const trouve = jeton
    ? await prisma.verificationToken.findFirst({
        where: { token: empreinteJeton(jeton), identifier: { startsWith: "ajout:" }, expires: { gt: new Date() } },
      })
    : null;
  if (!trouve) redirect("/profil?erreur=jeton#mail");

  await prisma.verificationToken.delete({ where: { identifier_token: { identifier: trouve.identifier, token: trouve.token } } });
  const [, userId, ...reste] = trouve.identifier.split(":");
  const email = reste.join(":");
  const autre = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (autre && autre.id !== userId) redirect("/profil?erreur=mailpris#mail");

  await prisma.user.update({ where: { id: userId }, data: { email, emailVerified: new Date() } });
  redirect("/profil?ok=mailok#mail");
}
