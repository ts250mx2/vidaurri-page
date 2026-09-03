import { cookies } from "next/headers";
import { COOKIE_MOSTRADOR } from "@/lib/mostrador/sesion";
import { destinoTrasLogin, RUTA_LOGIN_MOSTRADOR } from "@/lib/mostrador/volver";

// Salir del mostrador: borra la cookie y manda a login. Responde 303 y no
// JSON porque quien llega es el navegador (un <form> sin JavaScript o una
// navegación completa) y sigue la redirección con GET.
//
// POST = el vendedor pulsó "Salir". GET = IA rechazó el token a media página
// (SSR de `lib/mostrador/datos.ts` o `sesionVencida()` del navegador): hay
// que borrar la cookie ANTES de llegar a login, porque si el token todavía
// pasa la verificación local el proxy de borde rebotaría login → /mostrador
// y la página volvería a pedir a IA: un bucle. El GET además deja `volver`
// (a dónde regresar tras entrar) y `motivo=sesion`, que el proxy respeta
// para no rebotar y la página de login puede usar para avisar.

export const dynamic = "force-dynamic";

const MOTIVO_SESION = "sesion";

async function salir(destino: URL): Promise<Response> {
  const jar = await cookies();
  jar.delete(COOKIE_MOSTRADOR);
  // `new Response` y no `Response.redirect`: este último trae headers
  // inmutables y Next no podría anexarle el Set-Cookie del borrado.
  return new Response(null, {
    status: 303,
    headers: { Location: destino.toString() },
  });
}

export async function POST(request: Request) {
  return salir(new URL(RUTA_LOGIN_MOSTRADOR, request.url));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destino = new URL(RUTA_LOGIN_MOSTRADOR, request.url);
  // `volver` se acota aquí (y otra vez en la página de login): nunca sale de /mostrador.
  destino.searchParams.set("volver", destinoTrasLogin(searchParams.get("volver")));
  destino.searchParams.set("motivo", MOTIVO_SESION);
  return salir(destino);
}
