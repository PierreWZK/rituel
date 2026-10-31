import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { EmailConfig } from "next-auth/providers/email";
import { genererCode } from "@/lib/clans";
import { envoyerMail } from "@/lib/mail";
import { autoriser } from "@/lib/limite";
import { verifier } from "@/lib/motdepasse";
import { prisma } from "@/lib/prisma";

async function envoyerLien({ identifier, url }: { identifier: string; url: string }) {
  envoyerMail(
    identifier,
    "Votre lien de connexion à Rituel",
    `Bonjour,\n\nPour vous connecter à Rituel, ouvrez ce lien (valable 15 minutes) :\n${url}\n\nSi vous n'avez rien demandé, ignorez ce message.`,
  );
}

// Fournisseur e-mail maison : Auth.js n'appelle pas nodemailer lui-même, on utilise la version corrigée installée.
const lienMagique = {
  id: "email",
  type: "email",
  name: "E-mail",
  from: process.env.EMAIL_FROM ?? "Rituel <rituel@projectp.fr>",
  maxAge: 15 * 60,
  sendVerificationRequest: envoyerLien,
  options: {},
} as EmailConfig;

/** Les administrateurs sont listés dans ADMIN_EMAILS, séparés par des virgules. */
export function estAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

/** Connexion par pseudo (sans tenir compte de la casse) et mot de passe. */
const pseudoMotDePasse = Credentials({
  id: "motdepasse",
  credentials: { pseudo: {}, motDePasse: {} },
  async authorize(identifiants) {
    const pseudo = String(identifiants.pseudo ?? "").trim();
    const mdp = String(identifiants.motDePasse ?? "");
    if (!pseudo || !mdp || !autoriser(`mdp:${pseudo.toLowerCase()}`, 10, 15 * 60_000)) return null;
    const user = await prisma.user.findFirst({
      where: { name: { equals: pseudo, mode: "insensitive" } },
      select: { id: true, name: true, motDePasse: true },
    });
    if (!user?.motDePasse || !(await verifier(mdp, user.motDePasse))) return null;
    return { id: user.id, name: user.name };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Derrière le proxy de Coolify (Traefik), l'hôte vient des en-têtes transmis.
  trustHost: true,
  // Auth.js n'accepte le mot de passe qu'avec des sessions JWT.
  session: { strategy: "jwt" },
  providers: [lienMagique, pseudoMotDePasse],
  // newUser : à la première connexion par lien magique, on passe par le profil pour choisir son pseudo.
  pages: { signIn: "/connexion", verifyRequest: "/connexion?envoye=1", error: "/connexion", newUser: "/profil?bienvenue=1" },
  callbacks: {
    // Pseudo et e-mail relus en base à chaque requête : un changement de profil se voit tout de suite.
    async session({ session, token }) {
      const user = token.sub
        ? await prisma.user.findUnique({ where: { id: token.sub }, select: { id: true, name: true, email: true } })
        : null;
      if (!user) return { ...session, user: undefined } as unknown as typeof session;
      session.user = { ...session.user, id: user.id, name: user.name, email: user.email ?? "" };
      return session;
    },
  },
  events: {
    // Pseudo provisoire, remplacé sur la page de bienvenue : jamais tiré de l'e-mail, qui reste privé.
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({ where: { id: user.id }, data: { name: `joueur-${genererCode().toLowerCase()}` } });
      }
    },
  },
});
