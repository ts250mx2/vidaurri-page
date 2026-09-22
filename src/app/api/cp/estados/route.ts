import { listarEstados } from "@/lib/cp/sepomex";

// `GET /api/cp/estados` → los 32 estados `{ clave, nombre }`, por nombre.

export const dynamic = "force-dynamic";

const CACHE = "public, max-age=86400, s-maxage=604800";

export async function GET() {
  try {
    return Response.json({ ok: true, estados: await listarEstados() }, { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    console.error("[cp] no se pudo leer el catálogo de estados", error);
    return Response.json({ ok: false, error: "No se pudo leer la lista de estados" }, { status: 500 });
  }
}
