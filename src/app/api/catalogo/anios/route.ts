import { rangoAniosDeModelo } from "@/lib/catalogo";

// Rango de años con aplicaciones del modelo elegido (select "Año" del buscador).

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idModelo = Number(searchParams.get("modelo")) || 0;
  try {
    const rango = await rangoAniosDeModelo(idModelo);
    return Response.json(
      { rango },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (error) {
    console.error("Error consultando años del modelo:", error);
    return Response.json({ rango: null }, { status: 502 });
  }
}
