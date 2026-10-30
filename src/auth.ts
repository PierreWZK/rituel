import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import { createTransport } from "nodemailer";
import { prisma } from "@/lib/prisma";

async function envoyerLien({ identifier, url }: { identifier: string; url: string }) {
  if (!process.env.EMAIL_SERVER && process.env.NODE_ENV !== "production") {
    console.log(`\n🔗 Lien de connexion pour ${identifier} :\n${url}\n`);
    return;
  }
  await createTransport(process.env.EMAIL_SERVER).sendMail({
    to: identifier,
    from: process.env.EMAIL_FROM,
    subject: "Votre lien de connexion à Rituel",
    text: `Bonjour,\n\nPour vous connecter à Rituel, ouvrez ce lien (valable 15 minutes) :\n${url}\n\nSi vous n'avez rien demandé, ignorez ce message.`,
  });
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Derrière le proxy de Coolify (Traefik), l'hôte vient des en-têtes transmis.
  trustHost: true,
  providers: [lienMagique],
  pages: { signIn: "/connexion", verifyRequest: "/connexion?envoye=1", error: "/connexion" },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    // Pseudo par défaut : la partie avant le @.
    async createUser({ user }) {
      if (user.id && user.email) {
        await prisma.user.update({ where: { id: user.id }, data: { name: user.email.split("@")[0] } });
      }
    },
  },
});
