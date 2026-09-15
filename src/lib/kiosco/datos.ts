import { redirect } from "next/navigation";
import { mensajeDeError, respuestaOk } from "@/lib/mostrador/api";
import { reenviarAKiosco } from "./api";
import { RUTA_KIOSCO_ACTIVAR } from "./rutas";
import { cabeceraKiosco, sesionKiosco } from "./sesion";
import { sanearPedido, type PedidoKiosco } from "./tipos";

// Lectura del borrador para las páginas de SERVIDOR del kiosco (SSR directo
// contra IA, sin pasar por los proxies HTTP de PAGE). Solo hay una lectura
// porque el kiosco solo sabe una cosa: qué lleva el cliente en su pedido.
// Importa `next/navigation` y lee la cookie: no se empaqueta para el navegador.

const ERROR_LECTURA = "No fue posible leer tu pedido";

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

  const { datos } = await reenviarAKiosco("/borrador", { kiosco: cabeceraKiosco(sesion) });
  if (!respuestaOk(datos)) {
    console.error("[kiosco] IA no devolvió el borrador", datos);
    throw new Error(mensajeDeError(datos, ERROR_LECTURA));
  }
  return sanearPedido(datos.pedido);
}
