import { urlFotoAldo } from "@/lib/aldo";

// Proxy publico de las fotos de piezas NUEVAS (S3 del catalogo de Aldo).
// A diferencia de vidaurri-ia, aqui NO se exige sesion: es la web publica.
// Cache larga: las fotos por codigo practicamente no cambian.

// Ojo con `thumb=1`: las miniaturas del S3 pesan 2-5 KB y se ven pixeladas en
// cuanto la foto pasa de ~120 px. Úsalo solo en listas muy densas.
const CODIGO_VALIDO = /^[a-z0-9._/ -]{1,30}$/i;

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
      // El S3 es contenido estatico: Next puede cachear la respuesta.
      cache: "force-cache",
    });
    if (!res.ok) return new Response("Sin foto", { status: 404 });

    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Sin foto", { status: 404 });
  }
}
