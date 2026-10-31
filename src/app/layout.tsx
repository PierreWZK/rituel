import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Outfit } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { SITE } from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-title" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-text" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

// Pas de canonical ni d'openGraph ici : ils seraient hérités par les pages privées. Chaque page publique appelle apercu().
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Rituel · Tous vos jeux du jour, entre amis",
  description: "Un annuaire de jeux journaliers, une routine à cocher et des clans pour comparer vos résultats.",
};

async function seDeconnecter() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="fr" className={`${outfit.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <div className="page">
          <header className="nav verre">
            <Link href="/" className="logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M22.5 14a8.5 8.5 0 1 1-2.5-6" stroke="var(--menthe)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M9.5 14.2l3 3 6-6.2" stroke="var(--menthe)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              rituel
            </Link>
            <nav className="nav-links">
              <Link href="/annuaire">Annuaire</Link>
              <Link href="/routine">Ma routine</Link>
              <Link href="/clans">Clans</Link>
              {session?.user ? (
                <form action={seDeconnecter} className="session">
                  <Link href="/profil" className="pseudo" title="Mon profil">{session.user.name}</Link>
                  <button type="submit" className="bouton">Se déconnecter</button>
                </form>
              ) : (
                <Link href="/connexion" className="bouton bouton-principal">Se connecter</Link>
              )}
            </nav>
          </header>

          <main>{children}</main>

          <footer className="pied">
            <span>Rituel · un projet ProjectP</span>
            <a href="https://projectp.fr/">30 jours, 30 projets</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
