// Proxy del chat "Vico" hacia el webservice del Vendedor IA de vidaurri-ia
// (POST /api/whatsapp/vendedor). La API key vive SOLO aqui, del lado del
// servidor: el navegador nunca la ve. La sesion del visitante se usa como
// "telefono" (clave de conversacion) en el webservice; se genera numerica con
// prefijo 77 para no chocar con telefonos reales.

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_MENSAJE = 2000;
const LIMITE_POR_MINUTO_IP = 10;
const SESION_VALIDA = /^77\d{10,17}$/;

// Rate limit por IP en memoria (una instancia). Suficiente para la fase local.
const ventanas = new Map<string, number[]>();

function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const ventana = (ventanas.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  if (ventana.length >= LIMITE_POR_MINUTO_IP) return true;
  ventana.push(ahora);
  ventanas.set(ip, ventana);
  // Purga simple para que el mapa no crezca sin limite.
  if (ventanas.size > 5000) {
    for (const [clave, marcas] of ventanas) {
      if (marcas.every((t) => ahora - t >= 60_000)) ventanas.delete(clave);
    }
  }
  return false;
}

function nuevaSesion(): string {
  const azar = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `77${Date.now()}${azar}`.slice(0, 19);
}

export async function POST(request: Request) {
  const base = process.env.VENDEDOR_IA_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;
  if (!base || !apiKey) {
    return Response.json(
      { ok: false, error: "El asistente no está configurado" },
      { status: 500 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (excedeLimite(ip)) {
    return Response.json(
      { ok: false, error: "Demasiados mensajes seguidos; espera un momento" },
      { status: 429 }
    );
  }

  let cuerpo: { sesion?: string; mensaje?: string; reiniciar?: boolean };
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  const mensaje = String(cuerpo.mensaje ?? "").trim().slice(0, MAX_MENSAJE);
  if (!mensaje) {
    return Response.json({ ok: false, error: "Falta el mensaje" }, { status: 400 });
  }
  const sesion = SESION_VALIDA.test(String(cuerpo.sesion ?? ""))
    ? String(cuerpo.sesion)
    : nuevaSesion();

  try {
    const res = await fetch(`${base}/api/whatsapp/vendedor`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({
        telefono: sesion,
        mensaje,
        reiniciar: cuerpo.reiniciar === true,
      }),
      signal: AbortSignal.timeout(118_000),
    });

    const datos = (await res.json().catch(() => null)) as {
      ok?: boolean;
      respuesta?: string;
      fotos?: Array<{ codigo: string; url: string }>;
      error?: string;
    } | null;

    if (!res.ok || !datos?.ok) {
      const estado = res.status === 429 ? 429 : 502;
      return Response.json(
        {
          ok: false,
          sesion,
          error:
            datos?.error ?? "El asistente no pudo responder en este momento",
        },
        { status: estado }
      );
    }

    return Response.json({
      ok: true,
      sesion,
      respuesta: datos.respuesta ?? "",
      fotos: Array.isArray(datos.fotos) ? datos.fotos.slice(0, 3) : [],
    });
  } catch (error) {
    console.error("Error llamando al webservice del Vendedor IA:", error);
    return Response.json(
      { ok: false, sesion, error: "El asistente no pudo responder en este momento" },
      { status: 502 }
    );
  }
}
