import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/connexion", "/routine", "/clans", "/proposer"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
