import { listarMunicipios } from "@/lib/cp/sepomex";

// `GET /api/cp/municipios?estado=19` → los municipios de ese estado
// `{ clave, nombre }`, por nombre.

export const dynamic = "force-dynamic";

const CACHE = "public, max-age=86400, s-maxage=604800";

export async function GET(request: Request) {
  const estado = (new URL(request.url).searchParams.get("estado") ?? "").trim();
  if (!/^\d{2}$/.test(estado)) {
    return Response.json({ ok: false, error: "Estado inválido" }, { status: 400 });
  }
  try {
    const municipios = await listarMunicipios(estado);
    return Response.json({ ok: true, municipios }, { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    console.error("[cp] no se pudo leer el catálogo de municipios", error);
    return Response.json({ ok: false, error: "No se pudo leer la lista de municipios" }, { status: 500 });
  }
}
