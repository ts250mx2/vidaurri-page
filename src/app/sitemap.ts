import type { MetadataRoute } from "next";
import { listarMarcasSurtidas } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";
import { urlSitio } from "@/config/negocio";

// Sitemap: las páginas estáticas siempre; las landings por marca del catálogo
// (/refacciones/[marca], mismo contrato de URLs que el catálogo) solo si la
// base responde — si falla, degrada a las estáticas sin romper.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlSitio();

  const estaticas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/refacciones`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/usadas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/mayoreo`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/nosotros`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/sucursales`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${base}/aviso-de-privacidad`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  let porMarca: MetadataRoute.Sitemap = [];
  try {
    // Solo marcas con piezas disponibles: indexar landings vacías es thin
    // content y desperdicia rastreo.
    const marcas = await listarMarcasSurtidas();
    const slugs = new Set<string>();
    for (const marca of marcas) {
      const slug = slugificar(marca.linea);
      if (!slug || slugs.has(slug)) continue;
      slugs.add(slug);
      porMarca.push({
        url: `${base}/refacciones/${slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    porMarca = [];
  }

  return [...estaticas, ...porMarca];
}
