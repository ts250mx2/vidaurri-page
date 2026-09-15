import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_KIOSCO, verificarTokenKiosco } from "@/lib/kiosco/sesion";
import { esRutaKiosco, esRutaKioscoAbierta, RUTA_KIOSCO_ACTIVAR } from "@/lib/kiosco/rutas";
import { HEADER_RUTA_MOSTRADOR } from "@/lib/mostrador/api";
import { COOKIE_MOSTRADOR, verificarTokenMostrador } from "@/lib/mostrador/sesion";
import { RUTA_LOGIN_MOSTRADOR, RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// Guardia de borde de /mostrador y /kiosco (Next 16: `proxy.ts`, no
// `middleware.ts`). Son DOS guardias distintos sobre dos cookies distintas y
// dos secretos distintos, y ninguno sabe del otro: la cookie del kiosco no
// abre /mostrador (ahí se busca `mostrador_sesion`, audiencia "mostrador") y
// la del mostrador no abre /kiosco (aquí se busca `kiosco_dispositivo`,
// audiencia "kiosco"). Esa separación es todo el modelo de acceso.
//
// En /mostrador se verifica la cookie del vendedor con el secreto compartido y
// se decide antes de renderizar: sin sesión válida todo /mostrador/* manda a
// login (recordando a dónde iba); con sesión válida, login rebota a la cola de
// pedidos. Solo corre en las rutas del matcher: el sitio público ni se entera.

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

/**
 * /kiosco: la credencial es del APARATO. Sin cookie válida, todo el área
 * manda a la pantalla de activación; `/kiosco/activar` y `/kiosco/salir`
 * quedan fuera del candado porque son justo las dos puertas (una para entrar
 * al modo kiosco, otra para salirse) y ambas piden usuario y clave del POS.
 */
async function guardiaKiosco(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (esRutaKioscoAbierta(pathname)) return NextResponse.next();

  const token = request.cookies.get(COOKIE_KIOSCO)?.value?.trim() ?? "";
  const sesion = token ? await verificarTokenKiosco(token) : null;
  if (sesion) return NextResponse.next();

  const respuesta = NextResponse.redirect(new URL(RUTA_KIOSCO_ACTIVAR, request.url));
  // Cookie vencida o firmada con otro secreto: se limpia para que el
  // navegador no la siga mandando en cada petición.
  if (token) respuesta.cookies.delete(COOKIE_KIOSCO);
  return respuesta;
}

export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  if (esRutaKiosco(pathname)) return guardiaKiosco(request);
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
  matcher: ["/mostrador/:path*", "/kiosco/:path*"],
};
