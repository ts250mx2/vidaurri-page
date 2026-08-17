import type { MetadataRoute } from "next";
import { urlSitio } from "@/config/negocio";

// robots.txt: todo el sitio es público salvo los endpoints internos de /api/.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
