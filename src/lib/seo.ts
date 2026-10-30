import type { Metadata } from "next";

export const SITE = "https://rituel.projectp.fr";

/** Canonical, Open Graph et carte Twitter d'une page publique. Next remplace l'openGraph du layout en entier : l'image est donc répétée ici. */
export function apercu(titre: string, description: string, chemin: string): Metadata {
  return {
    title: titre,
    description,
    alternates: { canonical: chemin },
    openGraph: {
      title: titre,
      description,
      url: chemin,
      siteName: "Rituel",
      locale: "fr_FR",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Rituel, tous vos jeux du jour entre amis" }],
    },
    twitter: { card: "summary_large_image", title: titre, description, images: ["/og.png"] },
  };
}
