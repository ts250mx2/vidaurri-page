import { redirect } from "next/navigation";
import { mensajeDeError, respuestaOk } from "@/lib/mostrador/api";
import { reenviarAKiosco } from "./api";
import { RUTA_KIOSCO_ACTIVAR, RUTA_KIOSCO_ENTRAR } from "./rutas";
import { cabeceraKiosco, sesionClienteKiosco, sesionKiosco } from "./sesion";
import {
  sanearPedido,
  sanearPedidoDeCliente,
  type PedidoDeCliente,
  type PedidoKiosco,
} from "./tipos";

// Lecturas para las páginas de SERVIDOR del kiosco (SSR directo contra IA,
// sin pasar por los proxies HTTP de PAGE). Son dos: el borrador del aparato
// (lo único que sabía el kiosco original) y, desde que el cliente registrado
// puede entrar con su celular, la lista de SUS pedidos. Importa
// `next/navigation` y lee la cookie: no se empaqueta para el navegador.

const ERROR_LECTURA = "No fue posible leer tu pedido";
const ERROR_LECTURA_PEDIDOS = "No fue posible leer tus pedidos";

/**
 * El borrador vivo de este aparato; null si no hay ninguno. Sin cookie del
 * kiosco se manda a activar (el guardia de borde ya lo hizo, esto es el
 * cinturón para una llamada directa). Lanza Error con texto legible si IA no
 * responde: la pantalla lo pinta como aviso y el cliente puede seguir
 * buscando, en vez de quedarse frente a una página en blanco.
 */
export async function obtenerBorradorKiosco(): Promise<PedidoKiosco | null> {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);

  // Con cliente, el borrador que devuelve IA ya viene cotizado con su descuento.
  const cliente = await sesionClienteKiosco();
  const { datos } = await reenviarAKiosco("/borrador", {
    kiosco: cabeceraKiosco(sesion),
    cliente: cliente?.idCliente ?? null,
  });
  if (!respuestaOk(datos)) {
    console.error("[kiosco] IA no devolvió el borrador", datos);
    throw new Error(mensajeDeError(datos, ERROR_LECTURA));
  }
  return sanearPedido(datos.pedido);
}

/**
 * Los últimos pedidos del cliente que entró con su celular (IA los acota a
 * los suyos por `X-Kiosco-Cliente`). Sin sesión de cliente se manda a
 * entrar; sin cookie del aparato, a activar. Lanza Error con texto legible si
 * IA no responde, para que la pantalla lo diga en vez de fingir "no tienes
 * pedidos": un vacío honesto y un vacío por falla no son lo mismo.
 */
export async function obtenerPedidosDeCliente(): Promise<PedidoDeCliente[]> {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);
  const cliente = await sesionClienteKiosco();
  if (!cliente) redirect(RUTA_KIOSCO_ENTRAR);

  const { datos } = await reenviarAKiosco("/cliente/pedidos", {
    kiosco: cabeceraKiosco(sesion),
    cliente: cliente.idCliente,
  });
  if (!respuestaOk(datos)) {
    console.error("[kiosco] IA no devolvió los pedidos del cliente", datos);
    throw new Error(mensajeDeError(datos, ERROR_LECTURA_PEDIDOS));
  }
  const crudos = Array.isArray(datos.pedidos) ? datos.pedidos : [];
  return crudos.map(sanearPedidoDeCliente).filter((p): p is PedidoDeCliente => p !== null);
}
