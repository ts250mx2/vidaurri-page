// Datos duros del negocio en un solo lugar. Los valores marcados PENDIENTE
// son provisionales (tomados de fuentes públicas o placeholder) y deben
// confirmarse con Autopartes Vidaurri antes de publicar el sitio.

export const NEGOCIO = {
  nombre: "Autopartes Vidaurri",
  razonSocial: "Autopartes Vidaurri, S.A. de C.V.",
  ciudad: "Monterrey, N.L.",
  descripcionCorta:
    "Más de 40 años importando y distribuyendo refacciones automotrices de colisión, nuevas y usadas, en Monterrey.",
  // PENDIENTE: confirmar año real de fundación ("más de 40 años" es lo público).
  experiencia: "Más de 40 años",

  /** Número de WhatsApp del Vendedor IA (solo dígitos, formato wa.me). */
  whatsapp: "16416584476",
  whatsappBonito: "+1 641 658 4476",

  /** Nombre del asistente IA de la página y de WhatsApp. */
  asistente: "Vico",

  /** Teléfono general de la casa. Es el único verificado (fuentes públicas).
   *  PENDIENTE: si cada sucursal tiene su propia línea, agrégala abajo. */
  telefono: "+52 81 8354 2999",
  telefonoBonito: "(81) 8354 2999",

  // Direcciones tomadas de fuentes públicas.
  // `telefono` por sucursal: se omite a propósito mientras no esté confirmado.
  // Publicar el número de la matriz en las dos sucursales manda a quien llama a
  // Fierro con la matriz, y eso quema una venta.
  // `horario`: PENDIENTE. Mientras no lo confirme el cliente NO se publica —
  // un cliente que llega el sábado y encuentra cerrado no vuelve.
  sucursales: [
    {
      nombre: "Matriz",
      direccion: "Jesús M. Garza 2616, Col. Pablo A. de la Garza, 64550 Monterrey, N.L.",
      telefono: undefined as string | undefined,
      horario: undefined as string | undefined,
      mapsUrl: "https://maps.google.com/?q=Autopartes+Vidaurri+Jesus+M+Garza+2616+Monterrey",
    },
    {
      nombre: "Sucursal Fierro",
      direccion: "Antonio I. Villarreal 1421, Col. Fierro, Monterrey, N.L.",
      telefono: undefined as string | undefined,
      horario: undefined as string | undefined,
      mapsUrl: "https://maps.google.com/?q=Autopartes+Vidaurri+Antonio+I+Villarreal+1421+Monterrey",
    },
  ],

  facebook: "https://www.facebook.com/apvidaurri/",
} as const;

/** URL de conversación de WhatsApp con texto prellenado. */
export function urlWhatsApp(texto?: string): string {
  const base = `https://wa.me/${NEGOCIO.whatsapp}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/** Prellenados de WhatsApp por contexto: el código de pieza es obligatorio
 *  cuando existe — es el puente con el catálogo que el Vendedor IA ya sabe buscar. */
export const PRELLENADOS = {
  generico: "Hola, busco una pieza de colisión. Mi auto es: ",
  pieza: (nombre: string, codigo: string) =>
    `Hola, quiero cotizar: ${nombre} (código ${codigo}). ¿La tienen disponible?`,
  usada: (nombre: string, codigo: string) =>
    `Hola, vi la pieza usada ${nombre} (código ${codigo}) en su página. ¿Sigue disponible? ¿Me mandan más fotos?`,
  sinResultados: (termino: string) =>
    `Hola, busqué "${termino}" en su página y no aparece. ¿La pueden conseguir?`,
  mayoreo: "Hola, tengo un taller/refaccionaria y quiero cotización de mayoreo.",
} as const;

/** URL pública del sitio (metadatos, sitemap y JSON-LD). */
export function urlSitio(): string {
  return process.env.SITE_URL || "http://localhost:3041";
}
