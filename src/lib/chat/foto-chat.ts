// La foto que el visitante adjunta en el chat de Vico. El navegador la manda ya
// reducida (components/chat/foto-cliente.ts) como data-URL; aquí se valida antes
// de pasarla al webservice del Vendedor IA. Solo se acepta el archivo en base64,
// NUNCA una URL: este endpoint es público y no debe servir para que el servidor
// descargue lo que un desconocido le indique.

/** Tope del base64. nginx corta la petición en 1 MB por omisión; el navegador
 *  apunta a quedar por debajo de FOTO_BASE64_OBJETIVO. */
export const FOTO_BASE64_MAX = 900_000;
export const FOTO_BASE64_OBJETIVO = 700_000;

const DATA_URL_FOTO = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export type LecturaFoto =
  | { ok: true; base64: string | null }
  | { ok: false; error: string };

/** `imagen` del cuerpo de /api/chat: ausente o vacía = sin foto. */
export function leerFotoDelChat(valor: unknown): LecturaFoto {
  if (valor === undefined || valor === null || valor === "") return { ok: true, base64: null };
  if (typeof valor !== "string") return { ok: false, error: "La foto no es válida" };
  if (valor.length > FOTO_BASE64_MAX + 64) {
    return { ok: false, error: "La foto es demasiado grande; intenta con una más ligera" };
  }
  const base64 = DATA_URL_FOTO.exec(valor)?.[1];
  if (!base64) return { ok: false, error: "La foto no es válida" };
  return { ok: true, base64 };
}
