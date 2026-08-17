// Proxy publico de las fotos REALES de las piezas usadas (galeria de la
// Bodega Usado en sistema.apvidaurri.com). Sin sesion: web publica.

const BASE = "https://sistema.apvidaurri.com/imagenes_piezas";
// nombre_imagen es un nombre de archivo simple; nunca rutas ni querystrings.
const NOMBRE_VALIDO = /^[a-z0-9._ -]{1,120}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nombre = (searchParams.get("n") ?? "").trim();

  if (!NOMBRE_VALIDO.test(nombre) || nombre.includes("..")) {
    return new Response("Nombre inválido", { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(nombre)}`, {
      signal: AbortSignal.timeout(10000),
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
