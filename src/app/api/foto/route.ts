import { urlFotoAldo } from "@/lib/aldo";
import { sellarRespuesta } from "@/lib/marca-agua";

// Proxy publico de las fotos de piezas NUEVAS (S3 del catalogo de Aldo).
// A diferencia de vidaurri-ia, aqui NO se exige sesion: es la web publica.
// Cache larga: las fotos por codigo practicamente no cambian.
//
// Toda foto sale SELLADA con la marca de la casa (`lib/marca-agua`). Eso obliga
// a bufferear la imagen antes de responder — el flujo directo ya no es posible—,
// y por eso la cache de abajo importa mas que nunca: el sellado se paga una vez
// por foto y luego la sirve el navegador o el CDN.

// Ojo con `thumb=1`: las miniaturas del S3 pesan 2-5 KB y se ven pixeladas en
// cuanto la foto pasa de ~120 px. Úsalo solo en listas muy densas.
const CODIGO_VALIDO = /^[a-z0-9._/ -]{1,30}$/i;

const CACHE_FOTO =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codigo = (searchParams.get("codigo") ?? "").trim();
  const thumb = searchParams.get("thumb") === "1";

  if (!CODIGO_VALIDO.test(codigo)) {
    return new Response("Código inválido", { status: 400 });
  }

  try {
    const res = await fetch(urlFotoAldo(codigo, thumb), {
      signal: AbortSignal.timeout(10000),
      // Fuera de la Data Cache de Next: la respuesta ya no viaja en flujo (hay
      // que componerla), y guardar binarios ahi solo duplica el buffer.
      cache: "no-store",
    });
    if (!res.ok) {
      await res.body?.cancel();
      return new Response("Sin foto", { status: 404 });
    }

    const foto = await sellarRespuesta(res);
    if (!foto) return new Response("Sin foto", { status: 404 });

    return new Response(new Uint8Array(foto.cuerpo), {
      headers: {
        "Content-Type": foto.tipo,
        "Cache-Control": CACHE_FOTO,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Sin foto", { status: 404 });
  }
}
