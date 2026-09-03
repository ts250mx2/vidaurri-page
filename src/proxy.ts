import { NextResponse, type NextRequest } from "next/server";
import { HEADER_RUTA_MOSTRADOR } from "@/lib/mostrador/api";
import { COOKIE_MOSTRADOR, verificarTokenMostrador } from "@/lib/mostrador/sesion";
import { RUTA_LOGIN_MOSTRADOR, RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// Guardia de borde de /mostrador (Next 16: `proxy.ts`, no `middleware.ts`).
// Verifica la cookie del vendedor con el secreto compartido y decide antes de
// renderizar: sin sesión válida todo /mostrador/* manda a login (recordando a
// dónde iba); con sesión válida, login rebota a la cola de pedidos. Solo corre
// en las rutas del matcher: el sitio público ni se entera.

/**
 * `?motivo=sesion` en la URL de login lo pone `/api/mostrador/logout` (GET),
 * a donde van el SSR (`lib/mostrador/datos.ts`) y el navegador
 * (`sesionVencida()`) cuando IA rechazó el token. Con ese motivo el login NO
 * rebota a /mostrador aunque la cookie todavía pase aquí: si el token vale
 * localmente pero IA lo niega (secreto rotado, reloj desfasado), rebotar
 * volvería a pedir a IA, recibiría 401 y regresaría a login: un bucle. La
 * cookie ya la borró el logout; NO se borra otra vez aquí sobre
 * `NextResponse.next()`: Next fusiona ese Set-Cookie en el jar de la petición
 * como una cookie sin valor y `cookies()` la entrega con `value` undefined,
 * lo que revienta `tokenMostrador()` al renderizar.
 */
const PARAMETRO_MOTIVO = "motivo";
const MOTIVO_SESION = "sesion";

export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const token = request.cookies.get(COOKIE_MOSTRADOR)?.value?.trim() ?? "";
  const sesion = token ? await verificarTokenMostrador(token) : null;
  const esLogin = pathname === RUTA_LOGIN_MOSTRADOR;

  const esSesionRechazada = searchParams.get(PARAMETRO_MOTIVO) === MOTIVO_SESION;
  if (sesion && esLogin && !esSesionRechazada) {
    return NextResponse.redirect(new URL(RUTA_MOSTRADOR, request.url));
  }

  if (!sesion && !esLogin) {
    const destino = new URL(RUTA_LOGIN_MOSTRADOR, request.url);
    destino.searchParams.set("volver", `${pathname}${search}`);
    const respuesta = NextResponse.redirect(destino);
    // Cookie vencida o firmada con otro secreto: se limpia para que el
    // navegador no la siga mandando en cada petición.
    if (token) respuesta.cookies.delete(COOKIE_MOSTRADOR);
    return respuesta;
  }

  // La ruta que se va a renderizar viaja como header de PETICIÓN (no de
  // respuesta) para que las lecturas SSR de `lib/mostrador/datos.ts` sepan a
  // dónde volver si IA contesta 401 a media página. Se sobreescribe siempre:
  // lo que traiga el navegador en ese header no cuenta.
  const cabeceras = new Headers(request.headers);
  cabeceras.set(HEADER_RUTA_MOSTRADOR, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: cabeceras } });
}

export const config = {
  matcher: ["/mostrador/:path*"],
};
