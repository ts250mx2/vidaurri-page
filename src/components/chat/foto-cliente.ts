import { FOTO_BASE64_OBJETIVO } from "@/lib/chat/foto-chat";

// Prepara en el navegador la foto que el visitante le manda a Vico. Una foto de
// celular pesa 3-8 MB y la petición no debe pasar de 1 MB, así que se reduce
// aquí mismo; de paso el lienzo descarta los metadatos (ubicación, equipo).

export interface FotoLista {
  /** Lo que viaja a /api/chat. */
  dataUrl: string;
  /** Lo que se ve en el hilo y se guarda en sessionStorage: chica a propósito. */
  miniatura: string;
}

/** De mayor a menor: se queda con el primer intento que quepa en el objetivo. */
const INTENTOS = [
  { lado: 1280, calidad: 0.82 },
  { lado: 1024, calidad: 0.78 },
  { lado: 800, calidad: 0.72 },
  { lado: 640, calidad: 0.65 },
];
const LADO_MINIATURA = 220;

function dibujar(fuente: ImageBitmap, ladoMax: number, calidad: number): string {
  const escala = Math.min(1, ladoMax / Math.max(fuente.width, fuente.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.max(1, Math.round(fuente.width * escala));
  lienzo.height = Math.max(1, Math.round(fuente.height * escala));
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Sin lienzo disponible");
  // Fondo blanco: un PNG con transparencia saldría negro al pasar a JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.drawImage(fuente, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL("image/jpeg", calidad);
}

/** Lanza si el archivo no es una imagen que el navegador pueda abrir (p. ej. HEIC fuera de Safari). */
export async function prepararFoto(archivo: File): Promise<FotoLista> {
  // `from-image` endereza la foto según su orientación EXIF.
  const fuente = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  try {
    let dataUrl = "";
    for (const { lado, calidad } of INTENTOS) {
      dataUrl = dibujar(fuente, lado, calidad);
      if (dataUrl.length <= FOTO_BASE64_OBJETIVO) break;
    }
    if (dataUrl.length > FOTO_BASE64_OBJETIVO) throw new Error("La foto no se pudo reducir lo suficiente");
    return { dataUrl, miniatura: dibujar(fuente, LADO_MINIATURA, 0.7) };
  } finally {
    fuente.close();
  }
}
