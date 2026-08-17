import { listarModelosDeMarca } from "@/lib/catalogo";

// Opciones del select "Modelo" del buscador de vehiculo (cascada por marca).

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idLinea = Number(searchParams.get("marca")) || 0;
  try {
    const modelos = await listarModelosDeMarca(idLinea);
    return Response.json(
      { modelos },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (error) {
    console.error("Error listando modelos:", error);
    return Response.json({ modelos: [] }, { status: 502 });
  }
}
