// Proxy publico de las fotos REALES de las piezas usadas (galeria de la
// Bodega Usado en sistema.apvidaurri.com). Sin sesion: web publica.
//
// Aqui se juega la ventaja de la casa: 17,289 piezas con foto de la pieza
// exacta. El remoto es un servidor de bodega, no un CDN, y una peticion lenta
// no solo tarda: en HTTP/1.1 el navegador solo abre ~6 conexiones por origen,
// asi que una foto colgada deja EN BLANCO al resto de la parrilla. Por eso el
// contrato de esta ruta es "foto rapida o 404 rapido", nunca esperar.

const BASE = "https://sistema.apvidaurri.com/imagenes_piezas";
// nombre_imagen es un nombre de archivo simple; nunca rutas ni querystrings.
const NOMBRE_VALIDO = /^[a-z0-9._ -]{1,120}$/i;

// Solo mide la espera a la PRIMERA cabecera del remoto. La descarga en si no
// lleva reloj: cortarla a los 5s truncaria la foto de un celular con datos
// lentos, que es justo a quien hay que servirle.
const MS_PRIMER_BYTE = 5000;

// La foto de una pieza no cambia; y si la vuelven a tomar, un dia de retraso en
// el celular no rompe nada. Larga en el navegador (ahorra datos en el patio del
// taller) y muy larga en el CDN, que es quien absorbe la parrilla.
const CACHE_FOTO =
  "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400";
// El 404 se cachea corto: la foto puede subirse mañana y no queremos clavar la
// pieza como "sin foto" durante una semana.
const CACHE_SIN_FOTO = "public, max-age=60";

function respuestaTexto(
  cuerpo: string,
  status: number,
  cacheControl: string
): Response {
  return new Response(cuerpo, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nombre = (searchParams.get("n") ?? "").trim();

  if (!NOMBRE_VALIDO.test(nombre) || nombre.includes("..")) {
    return respuestaTexto("Nombre inválido", 400, "public, max-age=3600");
  }

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), MS_PRIMER_BYTE);

  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(nombre)}`, {
      signal: control.signal,
      // Fuera de la Data Cache de Next: guardar binarios ahi obliga a bufferear
      // la imagen entera antes de contestar (y se rinde arriba de 2 MB), que es
      // exactamente la espera que hay que quitar. Aqui va el flujo tal cual y la
      // cache de verdad es la del navegador y el CDN, via Cache-Control.
      cache: "no-store",
      headers: { Accept: "image/*,*/*;q=0.8" },
      redirect: "follow",
    });
    // Cabeceras en mano: se para el reloj para que no corte la descarga.
    clearTimeout(reloj);

    const tipo = res.headers.get("content-type") ?? "";
    // El servidor de bodega contesta 200 con una pagina de error cuando el
    // archivo no existe: sin esta guarda el navegador recibiria HTML disfrazado
    // de foto y pintaria el icono roto en vez de caer al respaldo.
    if (!res.ok || !res.body || !tipo.startsWith("image/")) {
      // Se cierra el cuerpo que no vamos a usar: si no, la conexion al remoto
      // queda abierta ocupando el pool.
      await res.body?.cancel();
      return respuestaTexto("Sin foto", 404, CACHE_SIN_FOTO);
    }

    // Content-Length NO se reenvia: si el remoto comprime, undici descomprime y
    // el largo declarado dejaria de cuadrar — el navegador se quedaria esperando
    // bytes que nunca llegan, que es la falla que estamos corrigiendo.
    return new Response(res.body, {
      headers: {
        "Content-Type": tipo,
        "Cache-Control": CACHE_FOTO,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    clearTimeout(reloj);
    return respuestaTexto("Sin foto", 404, CACHE_SIN_FOTO);
  }
}
