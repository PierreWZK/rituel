import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/seo";

// Lu à chaque requête : la base n'est pas joignable pendant le build Docker, et l'annuaire grandit.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jeux = await prisma.game.findMany({ select: { slug: true, createdAt: true } });
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/annuaire`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/intrus`, changeFrequency: "daily", priority: 0.8 },
    ...jeux.map((j) => ({ url: `${SITE}/jeux/${j.slug}`, lastModified: j.createdAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
