import type { MetadataRoute } from "next";
import { urlSitio } from "@/config/negocio";

// robots.txt: todo el sitio es público salvo los endpoints internos de /api/,
// el área del vendedor en /mostrador y el kiosco de autoservicio en /kiosco
// (las dos llevan además noindex en su layout).

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/mostrador", "/kiosco"],
    },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
