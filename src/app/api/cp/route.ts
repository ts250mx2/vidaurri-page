import { consultarCp } from "@/lib/cp/sepomex";

// `GET /api/cp?cp=64000` → estado, municipio y colonias de ese código postal
// (catálogo de Correos de México). Público y sin sesión: es un catálogo
// nacional, no un dato de la casa. Cache larga: cambia unas veces al año.

export const dynamic = "force-dynamic";

const CACHE = "public, max-age=86400, s-maxage=604800";

export async function GET(request: Request) {
  const cp = (new URL(request.url).searchParams.get("cp") ?? "").trim();
  if (!/^\d{5}$/.test(cp)) {
    return Response.json({ ok: false, error: "El código postal son 5 dígitos" }, { status: 400 });
  }
  try {
    const resultado = await consultarCp(cp);
    if (!resultado) {
      return Response.json({ ok: false, error: "Ese código postal no está en el catálogo" }, { status: 404 });
    }
    return Response.json({ ok: true, ...resultado }, { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    console.error("[cp] no se pudo leer el catálogo de códigos postales", error);
    return Response.json({ ok: false, error: "No se pudo consultar el código postal" }, { status: 500 });
  }
}
