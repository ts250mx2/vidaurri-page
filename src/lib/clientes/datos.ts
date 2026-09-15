import { redirect } from "next/navigation";
import { AREA_CLIENTE } from "@/lib/kiosco/area";
import {
  sanearPedido,
  sanearPedidoDeCliente,
  type PedidoDeCliente,
  type PedidoKiosco,
} from "@/lib/kiosco/tipos";
import { mensajeDeError, respuestaOk } from "@/lib/mostrador/api";
import { reenviarAClientes } from "./api";
import { RUTA_CLIENTES } from "./rutas";
import { sesionCliente, type SesionCliente } from "./sesion";

// Lecturas para las páginas de SERVIDOR del área de clientes (SSR directo
// contra IA, sin pasar por los proxies HTTP de PAGE): el borrador vivo del
// cliente y la lista de SUS pedidos. Importa `next/navigation` y lee la
// cookie: no se empaqueta para el navegador.

const ERROR_LECTURA = "No fue posible leer tu pedido";
const ERROR_LECTURA_PEDIDOS = "No fue posible leer tus pedidos";

/** La sesión, o a entrar (el guardia de borde ya lo hizo; esto es el cinturón). */
export async function exigirSesionCliente(): Promise<SesionCliente> {
  const sesion = await sesionCliente();
  if (!sesion) redirect(RUTA_CLIENTES);
  return sesion;
}

/**
 * El borrador vivo del cliente (el mismo que arma por WhatsApp); null si no
 * hay ninguno. Lanza Error con texto legible si IA no responde: la pantalla lo
 * pinta como aviso y el cliente puede seguir buscando.
 */
export async function obtenerBorradorCliente(): Promise<PedidoKiosco | null> {
  const sesion = await exigirSesionCliente();
  const { datos } = await reenviarAClientes("/borrador", { cliente: sesion.idCliente });
  if (!respuestaOk(datos)) {
    console.error("[clientes] IA no devolvió el borrador", datos);
    throw new Error(mensajeDeError(datos, ERROR_LECTURA));
  }
  return sanearPedido(datos.pedido);
}

/**
 * Los últimos pedidos del cliente (IA los acota a los suyos por `X-Cliente`).
 * Lanza Error con texto legible si IA no responde, para que la pantalla lo
 * diga en vez de fingir "no tienes pedidos".
 */
export async function obtenerPedidosDelCliente(): Promise<PedidoDeCliente[]> {
  const sesion = await exigirSesionCliente();
  const { datos } = await reenviarAClientes(AREA_CLIENTE.rutaApiPedidos, { cliente: sesion.idCliente });
  if (!respuestaOk(datos)) {
    console.error("[clientes] IA no devolvió los pedidos del cliente", datos);
    throw new Error(mensajeDeError(datos, ERROR_LECTURA_PEDIDOS));
  }
  const crudos = Array.isArray(datos.pedidos) ? datos.pedidos : [];
  return crudos.map(sanearPedidoDeCliente).filter((p): p is PedidoDeCliente => p !== null);
}
