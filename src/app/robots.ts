import type { MetadataRoute } from "next";
import { urlSitio } from "@/config/negocio";

// robots.txt: todo el sitio es público salvo los endpoints internos de /api/ y
// el área del vendedor en /mostrador (que además lleva noindex en su layout).

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/mostrador"],
    },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
